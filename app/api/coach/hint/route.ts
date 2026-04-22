import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { requireScenarioById } from "@/lib/scenarios";
import { requireClientById } from "@/lib/clients";
import {
  COACH_HINT_MODEL,
  CoachOfflineError,
  getAnthropic,
  isCoachConfigured,
} from "@/lib/anthropic";
import { COACH_PERSONA } from "@/lib/prompts/coach-persona";
import {
  HINT_MAX_DRAFT_CHARS,
  HINT_MAX_TOKENS,
  buildHintPrompt,
} from "@/lib/prompts/hint-prompt";
import {
  DAILY_COACH_LIMIT,
  RateLimitError,
  incrementCoachUsage,
} from "@/lib/rate-limit";

export const runtime = "nodejs";

const BodySchema = z.object({
  scenarioId: z.string().min(1),
  currentDraft: z.string().max(HINT_MAX_DRAFT_CHARS).default(""),
});

export async function POST(request: Request): Promise<NextResponse> {
  if (!isCoachConfigured()) {
    return NextResponse.json(
      {
        error:
          "Coach is offline — add ANTHROPIC_API_KEY to .env.local and restart dev server.",
        code: "coach_offline",
      },
      { status: 503 },
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", code: "invalid_body" },
      { status: 400 },
    );
  }
  const { scenarioId, currentDraft } = parsed.data;

  const scenario = requireScenarioById(scenarioId);
  const client = requireClientById(scenario.client);
  const user = await getCurrentUser();

  try {
    await incrementCoachUsage(user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: err.message,
          code: "rate_limited",
          limit: DAILY_COACH_LIMIT,
        },
        { status: 429 },
      );
    }
    throw err;
  }

  try {
    const anthropic = getAnthropic();
    const resp = await anthropic.messages.create({
      model: COACH_HINT_MODEL,
      max_tokens: HINT_MAX_TOKENS,
      system: COACH_PERSONA,
      messages: [
        {
          role: "user",
          content: buildHintPrompt(scenario, client, currentDraft),
        },
      ],
    });

    const hint = resp.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!hint) {
      return NextResponse.json(
        {
          error: "Coach returned an empty hint. Try again in a moment.",
          code: "empty_response",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ hint });
  } catch (err) {
    if (err instanceof CoachOfflineError) {
      return NextResponse.json(
        { error: err.message, code: "coach_offline" },
        { status: 503 },
      );
    }
    console.error("[/api/coach/hint]", err);
    return NextResponse.json(
      { error: "Coach hit an error. Try again shortly.", code: "internal" },
      { status: 502 },
    );
  }
}
