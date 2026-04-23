import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

const BodySchema = z.object({
  guideSlug: z.string().min(1),
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

  const { guideSlug } = parsed.data;

  await prisma.guideProgress.upsert({
    where: { userId_guideSlug: { userId: user.id, guideSlug } },
    create: {
      userId: user.id,
      guideSlug,
    },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
