import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getAllScenarios, requireScenarioById } from "@/lib/scenarios";
import {
  calculateScenarioXp,
  getLevelForXp,
  getSkillLevelForXp,
} from "@/lib/xp";
import type { SkillKey } from "@/lib/skills";
import type { RubricScore } from "@/components/scenario/review-types";

export const runtime = "nodejs";

const BodySchema = z.object({
  scenarioId: z.string().min(1),
  userAnswer: z.string().min(1),
  userAnswerText: z.string().min(1),
  timeSpentSec: z.number().int().nonnegative(),
});

const STUB_NARRATIVE =
  "Sprint 2b will provide real AI-powered feedback. For now, the coach has logged " +
  "your response, generated an even per-criterion score for visual testing, and " +
  "awarded XP using the real scenario XP formula. Your full submission is stored " +
  "against your account and will be the input to the real review in the next sprint.";

// Quality score the stub hands back to the user. Real number in Sprint 2b.
const STUB_QUALITY = 75;

export async function POST(request: Request): Promise<NextResponse> {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const body = parsed.data;

  const scenario = requireScenarioById(body.scenarioId);
  const user = await getCurrentUser();

  // Stub rubric scores — each criterion at STUB_QUALITY percent.
  const rubricScores: RubricScore[] = scenario.rubric.map((row) => ({
    criterion: row.criterion,
    maxPoints: row.maxPoints,
    score: Math.round((STUB_QUALITY / 100) * row.maxPoints),
  }));
  const overallScore = rubricScores.reduce((sum, r) => sum + r.score, 0);

  // First-time flag and streak are stubbed per the Sprint 2a brief.
  const existingCompletion = await prisma.scenarioCompletion.findFirst({
    where: { userId: user.id, scenarioId: scenario.id },
  });
  const isFirstTime = !existingCompletion;

  const xp = calculateScenarioXp({
    xpBase: scenario.xpBase,
    qualityScore: STUB_QUALITY,
    streak: user.currentStreak,
    isFirstTime,
  });

  // Update skill progress JSON in place.
  const skillProgress = coerceSkillProgress(user.skillProgress);
  const skill = scenario.skill as SkillKey;
  const current = skillProgress[skill] ?? { level: 0, xp: 0 };
  const nextSkillXp = current.xp + xp.total;
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
        coachFeedback: STUB_NARRATIVE,
        rubricScores: rubricScores as unknown as object,
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
    rubricScores,
    narrative: STUB_NARRATIVE,
    xp,
    nextScenarioId,
  });
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
