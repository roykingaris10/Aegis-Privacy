// Review endpoint. Replaces Sprint 2a's /api/responses as the scenario
// submission route. Generates a structured review via Claude Sonnet
// (tool_use enforced), validates with Zod, retries once on malformed
// output, and on hard failure falls back to a placeholder review so the
// submission still persists cleanly.
//
// After the review is in hand it transactionally writes a Response row,
// a ScenarioCompletion row, and updates the user's XP / level / skill
// progress using the real overallScore as the quality score.

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
import type { SkillKey } from "@/lib/skills";
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

  const existingCompletion = await prisma.scenarioCompletion.findFirst({
    where: { userId: user.id, scenarioId: scenario.id },
  });
  const isFirstTime = !existingCompletion;

  const xp = calculateScenarioXp({
    xpBase: scenario.xpBase,
    qualityScore: overallScore,
    streak: user.currentStreak,
    isFirstTime,
  });

  const skillProgress = coerceSkillProgress(user.skillProgress);
  const skill = scenario.skill as SkillKey;
  const currentSkill = skillProgress[skill] ?? { level: 0, xp: 0 };
  const nextSkillXp = currentSkill.xp + xp.total;
  skillProgress[skill] = {
    xp: nextSkillXp,
    level: getSkillLevelForXp(nextSkillXp),
  };
  const nextTotalXp = user.totalXp + xp.total;
  const nextLevel = getLevelForXp(nextTotalXp);

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
        lastActiveDate: new Date(),
        skillProgress: skillProgress as unknown as object,
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
  });
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
