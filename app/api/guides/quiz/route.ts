import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { getLevelForXp } from "@/lib/xp";

export const runtime = "nodejs";

const BodySchema = z.object({
  guideSlug: z.string().min(1),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
});

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getCurrentUser();

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", code: "invalid_body" },
      { status: 400 },
    );
  }

  const { guideSlug, score, total } = parsed.data;
  const xpAwarded = score * 10;

  // Upsert guide progress — keep the best quiz score.
  const existing = await prisma.guideProgress.findUnique({
    where: { userId_guideSlug: { userId: user.id, guideSlug } },
  });

  const shouldUpdate = !existing || (existing.quizScore ?? 0) < score;

  if (shouldUpdate) {
    await prisma.guideProgress.upsert({
      where: { userId_guideSlug: { userId: user.id, guideSlug } },
      create: {
        userId: user.id,
        guideSlug,
        quizScore: score,
      },
      update: {
        quizScore: score,
      },
    });
  }

  // Award XP only on first completion or if score improved.
  const previousXp = existing ? (existing.quizScore ?? 0) * 10 : 0;
  const netXp = Math.max(0, xpAwarded - previousXp);

  if (netXp > 0) {
    const newTotalXp = user.totalXp + netXp;
    const newLevel = getLevelForXp(newTotalXp);
    await prisma.user.update({
      where: { id: user.id },
      data: { totalXp: newTotalXp, level: newLevel },
    });
  }

  return NextResponse.json({
    xpAwarded: netXp,
    quizScore: score,
    total,
    isNewBest: shouldUpdate,
  });
}
