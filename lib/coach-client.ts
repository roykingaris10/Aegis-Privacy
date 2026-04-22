// Client-side helper for consuming the /api/coach/brief SSE stream. Not
// a server module — plain fetch streaming works fine from client code
// and handles POST bodies (native EventSource is GET-only).

export type BriefEvent =
  | { type: "text"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string; code?: string };

export type BriefStreamCallbacks = {
  onDelta?: (accumulated: string, latest: string) => void;
  onDone?: (final: string) => void;
  onError?: (message: string, code?: string) => void;
};

export async function streamBriefing(
  scenarioId: string,
  callbacks: BriefStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch("/api/coach/brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId }),
    signal,
  });

  if (!res.body) {
    callbacks.onError?.("No streaming body on response", "no_body");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accum = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const chunk of parts) {
      const line = chunk.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(line.indexOf(":") + 1).trim();
      if (!payload) continue;
      let msg: BriefEvent;
      try {
        msg = JSON.parse(payload) as BriefEvent;
      } catch {
        continue;
      }
      if (msg.type === "text") {
        accum += msg.delta;
        callbacks.onDelta?.(accum, msg.delta);
      } else if (msg.type === "done") {
        callbacks.onDone?.(accum);
        return;
      } else if (msg.type === "error") {
        callbacks.onError?.(msg.message, msg.code);
        return;
      }
    }
  }
}
