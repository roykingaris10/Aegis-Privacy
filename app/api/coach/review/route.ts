// Review endpoint. Replaces Sprint 2a's /api/responses as the scenario
// submission route. Generates a structured review via Claude Sonnet
// (tool_use enforced), validates with Zod, retries once on malformed
// output, and on hard failure falls back to a placeholder review so the
// submission still persists cleanly.
//
// Sprint 3a wiring:
//   - applies updateStreak() to user.currentStreak / longestStreak /
//     lastActiveDate inside the same transaction as the completion.
//   - builds a UserStats snapshot using the post-completion state and
//     awards any newly-qualified badges to User.badges.
//   - returns a rich payload so the client can queue toasts for XP /
//     level-up / skill-level-up / streak-milestone / badge / tier-unlock.

import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getAllScenarios, requireScenarioById } from "@/lib/scenarios";
import { requireClientById } from "@/lib/clients";
import {
  COACH_REVIEW_MODEL,
  CoachOfflineError,
  getAnthropic,
  isCoachConfigured,
} from "@/lib/anthropic";
import { COACH_PERSONA } from "@/lib/prompts/coach-persona";
import {
  REVIEW_MAX_TOKENS,
  REVIEW_MAX_USER_CHARS,
  buildReviewPrompt,
  reviewTool,
} from "@/lib/prompts/review-prompt";
import {
  ReviewSchema,
  buildFallbackReview,
  type Review,
} from "@/lib/prompts/review-schema";
import {
  DAILY_COACH_LIMIT,
  RateLimitError,
  incrementCoachUsage,
} from "@/lib/rate-limit";
import {
  calculateScenarioXp,
  getLevelForXp,
  getSkillLevelForXp,
} from "@/lib/xp";
import { SKILLS, type SkillKey } from "@/lib/skills";
import { updateStreak } from "@/lib/streak";
import {
  newlyAwardedBadges,
  type CompletionSummary,
  type UserStats,
} from "@/lib/badges";
import type { Scenario } from "@/lib/scenarios";
import type { Client as ClientRecord } from "@/lib/clients";

export const runtime = "nodejs";

const BodySchema = z.object({
  scenarioId: z.string().min(1),
  userAnswer: z.string().min(1),
  userAnswerText: z.string().min(1).max(REVIEW_MAX_USER_CHARS),
  timeSpentSec: z.number().int().nonnegative(),
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!isCoachConfigured()) {
    return NextResponse.json(
      {
        error:
          "Coach is offline — add ANTHROPIC_API_KEY to .env.local and restart the dev server.",
        code: "coach_offline",
      },
      { status: 503 },
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", code: "invalid_body" },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const scenario = requireScenarioById(body.scenarioId);
  const client = requireClientById(scenario.client);
  const user = await getCurrentUser();

  try {
    await incrementCoachUsage(user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: err.message, code: "rate_limited", limit: DAILY_COACH_LIMIT },
        { status: 429 },
      );
    }
    throw err;
  }

  let review: Review;
  let usedFallback = false;
  try {
    review = await callReviewWithRetry(scenario, client, body.userAnswerText);
  } catch (err) {
    if (err instanceof CoachOfflineError) {
      return NextResponse.json(
        { error: err.message, code: "coach_offline" },
        { status: 503 },
      );
    }
    console.error("[/api/coach/review] fell back to stub:", err);
    review = buildFallbackReview(scenario);
    usedFallback = true;
  }

  // Recompute overallScore as the sum of rubric scores — the tool schema
  // asks for consistency but we don't trust the model more than we must.
  const overallScore = review.rubricScores.reduce((s, r) => s + r.score, 0);

  const existingCompletions = await prisma.scenarioCompletion.findMany({
    where: { userId: user.id },
  });
  const isFirstTime = !existingCompletions.some(
    (c) => c.scenarioId === scenario.id,
  );

  // ---- Streak ----
  const now = new Date();
  const streakUpdate = updateStreak(
    {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate ?? null,
    },
    now,
  );

  const xp = calculateScenarioXp({
    xpBase: scenario.xpBase,
    qualityScore: overallScore,
    streak: streakUpdate.currentStreak,
    isFirstTime,
  });

  // ---- Skill progression ----
  const skillProgress = coerceSkillProgress(user.skillProgress);
  const skill = scenario.skill as SkillKey;
  const prevSkill = skillProgress[skill] ?? { level: 0, xp: 0 };
  const nextSkillXp = prevSkill.xp + xp.total;
  const nextSkillLevel = getSkillLevelForXp(nextSkillXp);
  skillProgress[skill] = { xp: nextSkillXp, level: nextSkillLevel };
  const skillLeveledUp = nextSkillLevel > prevSkill.level;

  // ---- Level ----
  const nextTotalXp = user.totalXp + xp.total;
  const nextLevel = getLevelForXp(nextTotalXp);
  const leveledUp = nextLevel > user.level;
  const tierUnlocked =
    user.level < 6 && nextLevel >= 6
      ? 2
      : user.level < 13 && nextLevel >= 13
        ? 3
        : null;

  // ---- Badges ----
  const existingBadges = coerceBadges(user.badges);
  const priorCompletionSummaries: CompletionSummary[] = existingCompletions.map(
    (c) => ({
      scenarioId: c.scenarioId,
      // tier/skill/difficulty for prior completions are joined from YAML
      // via the scenarios loader; for ones we already have on file we
      // look them up.
      ...summarize(c.scenarioId, c.score),
    }),
  );
  const thisCompletion: CompletionSummary = {
    scenarioId: scenario.id,
    tier: scenario.tier,
    skill,
    difficulty: scenario.difficulty,
    score: overallScore,
    rubric: review.rubricScores.map((r) => ({
      criterion: r.criterion,
      score: r.score,
      maxPoints: r.maxPoints,
    })),
  };
  const allCompletionSummaries = [...priorCompletionSummaries, thisCompletion];
  const skillsCompleted = new Set<SkillKey>(
    allCompletionSummaries.map((c) => c.skill),
  );
  const skillLevels: Partial<Record<SkillKey, number>> = {};
  for (const s of SKILLS) {
    skillLevels[s.key] = skillProgress[s.key]?.level ?? 0;
  }
  // Pull guide-progress stats for badge criteria (Sprint 3b).
  const guideProgressRows = await prisma.guideProgress.findMany({
    where: { userId: user.id },
    select: { guideSlug: true, quizScore: true },
  });
  const { getGuideBySlug, getGuidesByTrack } = await import("@/lib/guides");
  const guideSkills = new Set<SkillKey>();
  let perfectQuiz = false;
  for (const row of guideProgressRows) {
    const g = getGuideBySlug(row.guideSlug);
    if (g) {
      guideSkills.add(g.skill);
      const totalQuestions = Math.round(g.quizXp / 10);
      if (row.quizScore != null && row.quizScore >= totalQuestions) {
        perfectQuiz = true;
      }
    }
  }
  const completedSlugs = new Set(guideProgressRows.map((r) => r.guideSlug));
  const tracks = ["bcs", "cippe", "cippuk"] as const;
  const completedAnyTrack = tracks.some((t) => {
    const gs = getGuidesByTrack(t);
    return gs.length > 0 && gs.every((g) => completedSlugs.has(g.slug));
  });

  const stats: UserStats = {
    level: nextLevel,
    totalXp: nextTotalXp,
    currentStreak: streakUpdate.currentStreak,
    longestStreak: streakUpdate.longestStreak,
    skillLevels,
    skillsCompleted,
    completions: allCompletionSummaries,
    viewedAnyGuide: guideProgressRows.length > 0,
    guidesCompleted: guideProgressRows.length,
    guideSkills,
    perfectQuiz,
    completedAnyTrack,
  };
  const newlyEarned = newlyAwardedBadges(stats, existingBadges);
  const nextBadges = [...existingBadges, ...newlyEarned.map((b) => b.id)];

  // ---- Persist ----
  await prisma.$transaction([
    prisma.response.create({
      data: {
        userId: user.id,
        scenarioId: scenario.id,
        userAnswer: body.userAnswer,
        coachFeedback: review.narrativeReview,
        rubricScores: review as unknown as object,
      },
    }),
    prisma.scenarioCompletion.create({
      data: {
        userId: user.id,
        scenarioId: scenario.id,
        score: overallScore,
        xpEarned: xp.total,
        timeSpentSec: body.timeSpentSec,
      },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: {
        totalXp: nextTotalXp,
        level: nextLevel,
        currentStreak: streakUpdate.currentStreak,
        longestStreak: streakUpdate.longestStreak,
        lastActiveDate: streakUpdate.lastActiveDate,
        skillProgress: skillProgress as unknown as object,
        badges: nextBadges as unknown as object,
      },
    }),
  ]);

  const nextScenarioId = await pickNextScenarioId(user.id, scenario.id);

  return NextResponse.json({
    overallScore,
    rubricScores: review.rubricScores,
    strengths: review.strengths,
    gaps: review.gaps,
    narrative: review.narrativeReview,
    exemplarCommentary: review.exemplarCommentary,
    xp,
    nextScenarioId,
    degraded: usedFallback,
    // Sprint 3a gamification signals for the client toast queue
    gamification: {
      leveledUp,
      newLevel: nextLevel,
      skillLeveledUp,
      skillKey: skill,
      newSkillLevel: nextSkillLevel,
      streak: streakUpdate.currentStreak,
      streakMilestone: streakUpdate.milestone,
      tierUnlocked,
      newlyAwardedBadges: newlyEarned.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        rarity: b.rarity,
        icon: b.icon,
      })),
    },
  });
}

// Given a prior completion id, build a best-effort CompletionSummary for
// badge evaluation. We look the scenario up in the YAML loader for tier
// / skill / difficulty. The rubric isn't persisted per-completion today,
// so we pass an empty rubric — criteria that require per-rubric-cell
// inspection (e.g. no_stone_unturned) therefore only fire on the
// current completion, which is the common case anyway.
function summarize(
  scenarioId: string,
  score: number,
): Omit<CompletionSummary, "scenarioId"> {
  const scenarios = getAllScenarios();
  const s = scenarios.find((x) => x.id === scenarioId);
  if (!s) {
    return {
      tier: 1,
      skill: "sar_handling",
      difficulty: "straightforward",
      score,
      rubric: [],
    };
  }
  return {
    tier: s.tier,
    skill: s.skill as SkillKey,
    difficulty: s.difficulty,
    score,
    rubric: [],
  };
}

async function callReviewWithRetry(
  scenario: Scenario,
  client: ClientRecord,
  userResponseText: string,
): Promise<Review> {
  const anthropic = getAnthropic();
  const tool = reviewTool(scenario);
  const prompt = buildReviewPrompt(scenario, client, userResponseText);

  const firstMessages: Anthropic.Messages.MessageParam[] = [
    { role: "user", content: prompt },
  ];

  const firstResp = await anthropic.messages.create({
    model: COACH_REVIEW_MODEL,
    max_tokens: REVIEW_MAX_TOKENS,
    system: COACH_PERSONA,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: firstMessages,
  });

  const first = extractToolInput(firstResp);
  const firstParsed = ReviewSchema.safeParse(first);
  if (firstParsed.success) return firstParsed.data;

  // Retry once with explicit feedback.
  const retryMessages: Anthropic.Messages.MessageParam[] = [
    ...firstMessages,
    { role: "assistant", content: firstResp.content },
    {
      role: "user",
      content:
        "Your previous response wasn't valid per the submit_review schema. Call submit_review again with strictly conforming arguments — check that overallScore equals the sum of rubricScores.score, every criterion appears exactly once with its exact text, every score is between 0 and its maxPoints, and all text fields are non-empty.",
    },
  ];

  const secondResp = await anthropic.messages.create({
    model: COACH_REVIEW_MODEL,
    max_tokens: REVIEW_MAX_TOKENS,
    system: COACH_PERSONA,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: retryMessages,
  });
  const second = extractToolInput(secondResp);
  const secondParsed = ReviewSchema.safeParse(second);
  if (secondParsed.success) return secondParsed.data;

  throw new Error(
    `Review output still invalid after retry: ${secondParsed.error.message}`,
  );
}

function extractToolInput(resp: Anthropic.Messages.Message): unknown {
  for (const block of resp.content) {
    if (block.type === "tool_use" && block.name === "submit_review") {
      return block.input;
    }
  }
  return null;
}

function coerceSkillProgress(
  raw: unknown,
): Record<string, { level: number; xp: number }> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, { level: number; xp: number }>;
  }
  return {};
}

function coerceBadges(raw: unknown): string[] {
  return Array.isArray(raw)
    ? (raw.filter((b) => typeof b === "string") as string[])
    : [];
}

async function pickNextScenarioId(
  userId: string,
  currentId: string,
): Promise<string | null> {
  const all = getAllScenarios();
  const completed = new Set(
    (
      await prisma.scenarioCompletion.findMany({
        where: { userId },
        select: { scenarioId: true },
      })
    ).map((c) => c.scenarioId),
  );
  const next = all.find((s) => s.id !== currentId && !completed.has(s.id));
  return next?.id ?? null;
}
