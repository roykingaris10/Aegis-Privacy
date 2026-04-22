// Anthropic singleton + model constants.
//
// The client is lazily constructed so missing keys don't crash on import;
// callers check `isCoachConfigured()` first and get a typed error otherwise.
// Prompt caching / advanced features are intentionally out of scope for 2b
// and can be layered in later without changing the public API.

import Anthropic from "@anthropic-ai/sdk";

export const COACH_BRIEFING_MODEL = "claude-haiku-4-5-20251001";
export const COACH_HINT_MODEL = "claude-haiku-4-5-20251001";
export const COACH_REVIEW_MODEL = "claude-sonnet-4-6";

export class CoachOfflineError extends Error {
  readonly code = "coach_offline" as const;
  constructor() {
    super("Coach is offline — ANTHROPIC_API_KEY is missing or empty.");
  }
}

export function isCoachConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

let _client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!isCoachConfigured()) throw new CoachOfflineError();
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _client;
}
