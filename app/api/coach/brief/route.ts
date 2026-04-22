// SSE briefing endpoint. Streams the pre-task briefing from Claude Haiku
// for the requested scenario. Briefings are cached in module scope by
// scenarioId because they're identical for every user; cache hits replay
// the stored text as a single SSE message and do NOT count toward the
// daily rate limit.
//
// SSE framing:
//   data: {"type":"text","delta":"..."}    // one per text chunk
//   data: {"type":"done"}                  // terminal
//   data: {"type":"error","message":"..."} // terminal on failure
// Lines end with \n\n per the SSE spec.

import { z } from "zod";

import { requireScenarioById } from "@/lib/scenarios";
import { requireClientById } from "@/lib/clients";
import { getCurrentUser } from "@/lib/current-user";
import {
  COACH_BRIEFING_MODEL,
  CoachOfflineError,
  getAnthropic,
  isCoachConfigured,
} from "@/lib/anthropic";
import { COACH_PERSONA } from "@/lib/prompts/coach-persona";
import {
  BRIEFING_MAX_TOKENS,
  buildBriefingPrompt,
} from "@/lib/prompts/briefing-prompt";
import { RateLimitError, incrementCoachUsage } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ scenarioId: z.string().min(1) });

const briefingCache = new Map<string, string>();

type SSEMessage =
  | { type: "text"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string; code?: string };

function sse(msg: SSEMessage): string {
  return `data: ${JSON.stringify(msg)}\n\n`;
}

function sseResponse(body: ReadableStream<Uint8Array>, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function errorStream(message: string, code: string, status: number): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(enc.encode(sse({ type: "error", message, code })));
      controller.enqueue(enc.encode(sse({ type: "done" })));
      controller.close();
    },
  });
  return sseResponse(stream, status);
}

export async function POST(request: Request): Promise<Response> {
  if (!isCoachConfigured()) {
    return errorStream(
      "Coach is offline — add ANTHROPIC_API_KEY to .env.local and restart dev server.",
      "coach_offline",
      503,
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorStream("Invalid request body", "invalid_body", 400);
  }
  const { scenarioId } = parsed.data;
  const scenario = requireScenarioById(scenarioId);
  const client = requireClientById(scenario.client);

  // Cache hit: replay without counting against the rate limit.
  const cached = briefingCache.get(scenarioId);
  if (cached) {
    const enc = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Replay in one chunk — the UX is still "live" because react-markdown
        // renders as it arrives. Splitting further adds latency without win.
        controller.enqueue(enc.encode(sse({ type: "text", delta: cached })));
        controller.enqueue(enc.encode(sse({ type: "done" })));
        controller.close();
      },
    });
    return sseResponse(stream);
  }

  // Cache miss: count against rate limit BEFORE we spend API tokens.
  const user = await getCurrentUser();
  try {
    await incrementCoachUsage(user.id);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return errorStream(err.message, "rate_limited", 429);
    }
    throw err;
  }

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropic = getAnthropic();
        const claudeStream = anthropic.messages.stream({
          model: COACH_BRIEFING_MODEL,
          max_tokens: BRIEFING_MAX_TOKENS,
          system: COACH_PERSONA,
          messages: [
            {
              role: "user",
              content: buildBriefingPrompt(scenario, client),
            },
          ],
        });

        let buffer = "";
        claudeStream.on("text", (textDelta: string) => {
          buffer += textDelta;
          controller.enqueue(
            enc.encode(sse({ type: "text", delta: textDelta })),
          );
        });

        const finalMessage = await claudeStream.finalMessage();
        void finalMessage;
        briefingCache.set(scenarioId, buffer);
        controller.enqueue(enc.encode(sse({ type: "done" })));
      } catch (err) {
        const message =
          err instanceof CoachOfflineError
            ? err.message
            : "Coach hit an error while briefing. Try again shortly.";
        const code =
          err instanceof CoachOfflineError ? "coach_offline" : "internal";
        console.error("[/api/coach/brief]", err);
        controller.enqueue(enc.encode(sse({ type: "error", message, code })));
        controller.enqueue(enc.encode(sse({ type: "done" })));
      } finally {
        controller.close();
      }
    },
  });

  return sseResponse(stream);
}
