// Streak math — pure functions so they're easy to test and move between
// server and client (the dashboard uses the same date-key helper for the
// 14-day history popover).
//
// Rules (per Sprint 3a brief):
//   - A day "counts" when the user completes at least one scenario on a
//     UTC calendar day.
//   - Same-day repeats don't increment.
//   - Consecutive UTC days increment.
//   - A gap of ≥1 day resets to 1 (no grace period yet).
//   - longestStreak is the max of (previous longest, new current).
//   - First-ever completion sets currentStreak = 1.

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
};

export type StreakUpdate = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date;
  /** Whether the completion moved the streak forward. */
  changed: boolean;
  /**
   * True if the current completion brought the streak to a notable
   * number (3, 7, 14, 30, 60, 100). Lets the UI fire milestone toasts
   * without re-checking.
   */
  milestone: number | null;
};

const MILESTONES = [3, 7, 14, 30, 60, 100] as const;

/** The UTC calendar day of a Date, as YYYY-MM-DD. */
export function utcDayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Difference in UTC calendar days between two dates (b - a). */
export function utcDaysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const aUtc = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const bUtc = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((bUtc - aUtc) / msPerDay);
}

export function updateStreak(
  state: StreakState,
  completedAt: Date,
): StreakUpdate {
  if (!(completedAt instanceof Date) || Number.isNaN(completedAt.getTime())) {
    throw new Error("completedAt must be a valid Date");
  }
  const { currentStreak, longestStreak, lastActiveDate } = state;

  if (!lastActiveDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(longestStreak, 1),
      lastActiveDate: completedAt,
      changed: true,
      milestone: null,
    };
  }

  const gap = utcDaysBetween(lastActiveDate, completedAt);

  if (gap < 0) {
    // The new completion is before the previous lastActiveDate —
    // probably out-of-order replay. Treat as a no-op to avoid corrupting
    // the streak; caller can decide how to handle (we don't throw).
    return {
      currentStreak,
      longestStreak,
      lastActiveDate,
      changed: false,
      milestone: null,
    };
  }

  if (gap === 0) {
    // Same-day repeat: lastActiveDate advances to the later timestamp
    // so we don't keep bouncing backward, but streak count stands.
    return {
      currentStreak,
      longestStreak,
      lastActiveDate: completedAt,
      changed: false,
      milestone: null,
    };
  }

  if (gap === 1) {
    const next = currentStreak + 1;
    return {
      currentStreak: next,
      longestStreak: Math.max(longestStreak, next),
      lastActiveDate: completedAt,
      changed: true,
      milestone: MILESTONES.includes(next as (typeof MILESTONES)[number])
        ? next
        : null,
    };
  }

  // gap >= 2: streak broke.
  return {
    currentStreak: 1,
    longestStreak,
    lastActiveDate: completedAt,
    changed: true,
    milestone: null,
  };
}

/** Test-only helper; exported for clarity. */
export function isMilestone(n: number): boolean {
  return MILESTONES.includes(n as (typeof MILESTONES)[number]);
}
