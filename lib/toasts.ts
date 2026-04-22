"use client";

// Client-side toast queue. Sonner renders toasts in the order they're
// triggered, but without a queue they stack and race each other. The
// queueToasts() helper fires a sequence of toast factories 1.5s apart
// so a single scenario submission can fire XP + skill-level + level-up
// + badges + streak milestone + tier unlock without overwhelming the
// user.

import { toast } from "sonner";
import type { BadgeRarity } from "@/lib/badges";
import { getTitleForLevel } from "@/lib/xp";

const GAP_MS = 1500;

export async function queueToasts(steps: Array<() => void>): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    steps[i]();
    if (i < steps.length - 1) {
      await new Promise((r) => setTimeout(r, GAP_MS));
    }
  }
}

export function toastXp(amount: number, breakdown: string) {
  toast(`+${amount} XP`, {
    description: breakdown,
  });
}

export function toastSkillLevelUp(skillLabel: string, newLevel: number) {
  toast(`${skillLabel} · Level ${newLevel}`, {
    description: "Skill levelled up.",
  });
}

export function toastLevelUp(newLevel: number) {
  toast(`Level ${newLevel}`, {
    description: getTitleForLevel(newLevel),
    duration: 6000,
  });
}

export function toastStreakMilestone(days: number) {
  toast(`🔥 ${days}-day streak`, {
    description: "Consistency compounds.",
    duration: 5000,
  });
}

export function toastTierUnlocked(tier: 2 | 3) {
  const label =
    tier === 2
      ? "Tier II — Mid-Market clients"
      : "Tier III — Enterprise clients";
  toast(`${label} unlocked`, {
    description:
      tier === 2
        ? "Hartwell Council, Silverbrook Care, and Polaris EdTech are now in the pool."
        : "Meridian Capital, Lanely NHS, and Aurelia Biotech are now in the pool.",
    duration: 6000,
  });
}

const RARITY_DESCRIPTOR: Record<BadgeRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  legendary: "Legendary",
};

export function toastBadge(badge: {
  name: string;
  description: string;
  rarity: BadgeRarity;
}) {
  toast(`🏅 ${badge.name}`, {
    description: `${RARITY_DESCRIPTOR[badge.rarity]} — ${badge.description}`,
    duration: 6500,
  });
}
