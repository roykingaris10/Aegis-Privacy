import { describe, expect, it } from "vitest";

import { isMilestone, updateStreak, utcDayKey, utcDaysBetween } from "./streak";

const d = (iso: string) => new Date(iso);

describe("utcDayKey", () => {
  it("returns YYYY-MM-DD in UTC", () => {
    expect(utcDayKey(d("2026-04-22T13:00:00.000Z"))).toBe("2026-04-22");
  });

  it("respects UTC even when local is a different day", () => {
    // Timezone-agnostic: we're always reading via UTC getters.
    expect(utcDayKey(d("2026-04-22T23:30:00.000Z"))).toBe("2026-04-22");
    expect(utcDayKey(d("2026-04-23T00:30:00.000Z"))).toBe("2026-04-23");
  });
});

describe("utcDaysBetween", () => {
  it("returns 0 for the same UTC day", () => {
    expect(
      utcDaysBetween(
        d("2026-04-22T01:00:00.000Z"),
        d("2026-04-22T22:00:00.000Z"),
      ),
    ).toBe(0);
  });

  it("returns 1 for consecutive UTC days", () => {
    expect(
      utcDaysBetween(
        d("2026-04-22T23:30:00.000Z"),
        d("2026-04-23T00:30:00.000Z"),
      ),
    ).toBe(1);
  });

  it("returns negative for out-of-order inputs", () => {
    expect(
      utcDaysBetween(d("2026-04-23T00:00:00Z"), d("2026-04-22T00:00:00Z")),
    ).toBe(-1);
  });
});

describe("updateStreak — edge cases per Sprint 3a brief", () => {
  const base = { currentStreak: 0, longestStreak: 0, lastActiveDate: null };

  it("first ever completion sets streak = 1", () => {
    const out = updateStreak(base, d("2026-04-22T12:00:00Z"));
    expect(out.currentStreak).toBe(1);
    expect(out.longestStreak).toBe(1);
    expect(out.changed).toBe(true);
    expect(out.milestone).toBeNull();
  });

  it("same-day repeat does not increment", () => {
    const out = updateStreak(
      {
        currentStreak: 5,
        longestStreak: 10,
        lastActiveDate: d("2026-04-22T08:00:00Z"),
      },
      d("2026-04-22T22:00:00Z"),
    );
    expect(out.currentStreak).toBe(5);
    expect(out.longestStreak).toBe(10);
    expect(out.changed).toBe(false);
  });

  it("consecutive day increments", () => {
    const out = updateStreak(
      {
        currentStreak: 2,
        longestStreak: 2,
        lastActiveDate: d("2026-04-22T12:00:00Z"),
      },
      d("2026-04-23T09:00:00Z"),
    );
    expect(out.currentStreak).toBe(3);
    expect(out.longestStreak).toBe(3);
    expect(out.milestone).toBe(3);
    expect(out.changed).toBe(true);
  });

  it("gap of 2 days resets to 1", () => {
    const out = updateStreak(
      {
        currentStreak: 6,
        longestStreak: 6,
        lastActiveDate: d("2026-04-20T12:00:00Z"),
      },
      d("2026-04-22T12:00:00Z"),
    );
    expect(out.currentStreak).toBe(1);
    expect(out.longestStreak).toBe(6); // longest is preserved
    expect(out.milestone).toBeNull();
  });

  it("completion spanning UTC midnight increments correctly", () => {
    // last active: 2026-04-22 late evening UTC
    // new:        2026-04-23 just after midnight UTC
    const out = updateStreak(
      {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: d("2026-04-22T23:45:00Z"),
      },
      d("2026-04-23T00:10:00Z"),
    );
    expect(out.currentStreak).toBe(2);
    expect(out.longestStreak).toBe(2);
  });

  it("longestStreak is preserved across a reset", () => {
    const out = updateStreak(
      {
        currentStreak: 0, // already reset
        longestStreak: 30,
        lastActiveDate: d("2026-03-01T12:00:00Z"),
      },
      d("2026-04-22T12:00:00Z"),
    );
    expect(out.currentStreak).toBe(1);
    expect(out.longestStreak).toBe(30);
  });

  it("returns milestone numbers for 3, 7, 14, 30, 60, 100", () => {
    for (const n of [3, 7, 14, 30, 60, 100]) {
      const out = updateStreak(
        {
          currentStreak: n - 1,
          longestStreak: n - 1,
          lastActiveDate: d("2026-04-21T12:00:00Z"),
        },
        d("2026-04-22T12:00:00Z"),
      );
      expect(out.currentStreak).toBe(n);
      expect(out.milestone).toBe(n);
      expect(isMilestone(n)).toBe(true);
    }
  });

  it("does not flag non-milestone numbers", () => {
    const out = updateStreak(
      {
        currentStreak: 4,
        longestStreak: 4,
        lastActiveDate: d("2026-04-21T12:00:00Z"),
      },
      d("2026-04-22T12:00:00Z"),
    );
    expect(out.currentStreak).toBe(5);
    expect(out.milestone).toBeNull();
    expect(isMilestone(5)).toBe(false);
  });

  it("out-of-order input is a no-op", () => {
    const out = updateStreak(
      {
        currentStreak: 3,
        longestStreak: 3,
        lastActiveDate: d("2026-04-22T12:00:00Z"),
      },
      d("2026-04-20T12:00:00Z"),
    );
    expect(out.currentStreak).toBe(3);
    expect(out.longestStreak).toBe(3);
    expect(out.changed).toBe(false);
  });

  it("throws on invalid date", () => {
    expect(() => updateStreak(base, new Date("not a date"))).toThrow();
  });
});
