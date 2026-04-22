import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

const BodySchema = z.object({
  specialism: z.enum([
    "data_protection",
    "information_governance",
    "privacy_engineering",
    "ai_governance",
  ]),
  goals: z.array(z.string().min(1)).max(8),
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
  const { specialism, goals } = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      specialism,
      goals: goals as unknown as object,
      onboardedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
