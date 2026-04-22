// Per-user-per-UTC-day rate limit for coach API calls. Stored in
// CoachUsage so it survives process restarts and scales when we move off
// SQLite.  On dev the limit is intentionally generous; the brief pins
// the production limit at 50/day and this is the knob that enforces it.

import { prisma } from "@/lib/db";

export const DAILY_COACH_LIMIT = 50;

export class RateLimitError extends Error {
  readonly code = "rate_limited" as const;
  readonly status = 429;
  readonly limit = DAILY_COACH_LIMIT;
  constructor(public readonly current: number) {
    super(
      `Coach rate limit reached for today (${current}/${DAILY_COACH_LIMIT}). Try again tomorrow.`,
    );
  }
}

function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Read the current count without incrementing. */
export async function getCoachUsageToday(userId: string): Promise<number> {
  const row = await prisma.coachUsage.findUnique({
    where: { userId_date: { userId, date: todayKey() } },
    select: { count: true },
  });
  return row?.count ?? 0;
}

/**
 * Increment the per-day counter and return the new count. Throws
 * RateLimitError if the pre-increment count already meets the cap, so
 * the caller can short-circuit before spending a Claude API call.
 */
export async function incrementCoachUsage(userId: string): Promise<number> {
  const date = todayKey();
  const existing = await prisma.coachUsage.findUnique({
    where: { userId_date: { userId, date } },
    select: { count: true },
  });
  const current = existing?.count ?? 0;
  if (current >= DAILY_COACH_LIMIT) throw new RateLimitError(current);

  const row = await prisma.coachUsage.upsert({
    where: { userId_date: { userId, date } },
    update: { count: { increment: 1 } },
    create: { userId, date, count: 1 },
    select: { count: true },
  });
  return row.count;
}
