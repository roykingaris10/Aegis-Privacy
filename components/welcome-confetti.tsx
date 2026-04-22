"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import confetti from "canvas-confetti";

/**
 * Client-side hook triggered after onboarding redirects to /?welcome=1.
 * Fires a tasteful confetti burst and a single welcome toast, then
 * strips the query param so a refresh doesn't re-fire.
 */
export function WelcomeConfetti(): null {
  const params = useSearchParams();
  const router = useRouter();

  React.useEffect(() => {
    if (params.get("welcome") !== "1") return;
    // Strip the ?welcome=1 immediately so navigation doesn't re-trigger.
    const url = new URL(window.location.href);
    url.searchParams.delete("welcome");
    router.replace(url.pathname + (url.search ? `?${url.searchParams}` : ""));

    // Two short bursts, left and right — feels celebratory without
    // being a Duolingo explosion.
    const defaults = {
      spread: 50,
      ticks: 70,
      gravity: 0.9,
      decay: 0.92,
      startVelocity: 35,
      particleCount: 40,
      scalar: 0.8,
    } as const;
    confetti({ ...defaults, angle: 60, origin: { x: 0.1, y: 0.6 } });
    confetti({ ...defaults, angle: 120, origin: { x: 0.9, y: 0.6 } });

    toast("Welcome to Aegis", {
      description:
        "Your first scenario is waiting in Today's Inbox. Good luck.",
      duration: 6000,
    });
  }, [params, router]);

  return null;
}
