# Sprint 2b Summary — AI Coach wired up

Sprint 2b replaces Sprint 2a's hardcoded briefing, hint, and review stubs
with live calls to the Anthropic API. The coach panel now streams a
pre-task briefing, answers Socratic hints on demand, and scores
submitted responses against each scenario's rubric with structured
output validated by Zod.

## What shipped

### Server

- **`lib/anthropic.ts`** — singleton client with model constants
  (`claude-haiku-4-5-20251001` for briefing + hint, `claude-sonnet-4-6`
  for review). Lazily instantiated; exposes `isCoachConfigured()` and a
  typed `CoachOfflineError` so missing API keys produce a friendly 503
  instead of a crash.
- **`lib/prompts/*`** —
  - `coach-persona.ts`: the ~200-word shared system prompt. Senior DPO
    voice, UK/EU framing, British English, explicit refusal of US law
    framings (CCPA / HIPAA).
  - `scenario-context.ts`: the scenario / client / tier / skill /
    regulatory overlay block injected into every prompt.
  - `briefing-prompt.ts`: 300-400-word brief, markdown, closes on an
    open question. Forbids giving the answer or referencing the
    exemplar.
  - `hint-prompt.ts`: single Socratic question, max two sentences,
    tailored to the current draft.
  - `review-prompt.ts`: structured review using the `submit_review`
    tool with an enforced JSON schema. Requires exact-rubric-count,
    sum-equals-overall scoring, UK/EU framing, concrete commentary.
    Includes the exemplar as benchmark but forbids quoting it back.
  - `review-schema.ts`: Zod mirror of the tool schema + a
    `buildFallbackReview()` helper that produces a schema-valid
    placeholder when parsing fails twice.
- **`lib/rate-limit.ts`** — per-user-per-UTC-day counter via the new
  `CoachUsage` table. `DAILY_COACH_LIMIT = 50`. `RateLimitError` (429)
  typed and thrown before any Claude tokens are spent.
- **`lib/coach-client.ts`** — client-side helper that reads the SSE
  stream from `/api/coach/brief` via `fetch` + `ReadableStream` (native
  `EventSource` is GET-only).

### API routes

- **`POST /api/coach/brief`** — SSE. In-memory module cache by
  `scenarioId` (briefings are user-independent). Cache hits replay
  without hitting Claude and without counting against the rate limit;
  cache misses count. Events: `{type:"text",delta}`, `{type:"done"}`,
  `{type:"error",message,code}`. Graceful offline / invalid-body /
  rate-limited framing inside the SSE envelope.
- **`POST /api/coach/hint`** — non-streaming JSON. Takes the current
  draft (capped at 4000 chars in the prompt builder) and returns a
  single hint. Three hints per scenario is enforced client-side.
- **`POST /api/coach/review`** — **the new submission endpoint;
  replaces Sprint 2a's `/api/responses`**. Uses `tool_use` with a
  forced `submit_review` tool so structured output is enforced by the
  model. Zod-validates the tool input; on parse failure retries once
  with explicit schema feedback; on second failure produces a
  schema-valid fallback review so the submission still persists. After
  the review is in hand, `calculateScenarioXp` is called with the real
  `overallScore` as the quality score, and `Response` +
  `ScenarioCompletion` + `User` are all updated in a single
  transaction. Returns the review plus the XP breakdown plus the next
  uncompleted scenario id.

### Data model

- New Prisma model `CoachUsage { id, userId, date, count }` with a
  composite unique `[userId, date]` and an index on `userId`. `date` is
  a `YYYY-MM-DD` UTC string to keep the key simple and collation-safe.
  Migration applied as `20260422113831_add_coach_usage`.
- `/api/responses` deleted. The scenario workspace now posts to
  `/api/coach/review`.

### Frontend

- **`CoachPanel`** split into focused tab components:
  - `CoachBriefingTab` — reads the SSE stream on mount, renders
    incrementally with `react-markdown` + `remark-gfm`, shows a
    three-dot typing indicator while streaming. On `coach_offline` /
    other errors, falls back to rendering the raw YAML briefing notes
    inline.
  - `CoachHintTab` — "Stuck? Give me a hint" button. Shows each hint
    as a numbered card. Tracks hint count client-side (max 3). Handles
    503 / 429 / internal errors with a clear message.
  - `CoachReviewTab` — extended review UI: headline score + XP
    breakdown, per-criterion rubric with commentary, side-by-side
    **Strengths** and **Gaps** panels, markdown-rendered narrative
    review, markdown-rendered exemplar commentary, and a collapsible
    exemplar preview. Shows a "Coach is reviewing… 10-20s" loading
    state while submitting. If the backend served a fallback review, a
    warning banner surfaces at the top.
- **`ResponseEditor`** now tracks and reports both word and character
  counts; 5000-char cap enforced client-side (red at over-cap, amber
  near-cap, submit button disabled). The editor's live text is
  exposed via a new `onDraftChange` prop so the hint tab can read the
  current draft on demand.
- **`scenario-workspace.tsx`** posts to `/api/coach/review` instead of
  `/api/responses`, surfaces `coach_offline` / `rate_limited` / other
  errors distinctly, and pipes the live draft to `CoachPanel` via a
  ref-backed `getCurrentDraft()` callback.

### Tests

- `lib/prompts/prompts.test.ts` — 21 tests covering persona content,
  scenario context rendering, brief builder constraints, hint builder
  draft-handling and trim behaviour, review builder rubric / exemplar
  embedding and user-response trimming, and `reviewTool` shape.
- `lib/prompts/review-schema.test.ts` — 12 tests covering a
  well-formed review, all six required fields, overallScore bounds,
  integer / non-empty / array constraints, totally malformed payloads,
  and that `buildFallbackReview()` always passes validation.
- Full suite: **63 / 63 passing** (up from 30 in Sprint 2a).

## Acceptance — self-verified

| # | Check | Result |
| - | ----- | ------ |
| 1 | `pnpm dev` starts clean | ✅ ready in ~1.2s, no console errors |
| 2 | `pnpm lint` | ✅ clean |
| 3 | `pnpm typecheck` | ✅ clean |
| 4 | `pnpm build` | ✅ clean, no warnings; 11 routes |
| 5 | `pnpm test` | ✅ 63/63 |
| 6 | Missing API key produces a friendly error, not a crash | ✅ all three endpoints return a 503 with `code:"coach_offline"` and a message naming `.env.local`; the SSE endpoint emits the error inside the stream envelope |
| 7 | Invalid body → 400 `invalid_body` | ✅ verified against `/api/coach/hint` |
| 8 | Scenario 2a routes still reachable | ✅ `/`, `/inbox`, `/scenario/scenario_001` all 200 |

### Needs your eyes (can't test from CLI without a key)

1. With `ANTHROPIC_API_KEY` set:
   - Open `/scenario/scenario_001`. The **Briefing** tab should start
     streaming immediately with the typing indicator, ending in a
     markdown-rendered briefing of ~300-400 words in senior-DPO voice.
   - Second visit to the same scenario should replay the cached
     briefing instantly (cache hit; no new API cost).
   - Click **Hint** (on a different scenario so the cache hit above
     doesn't interfere) and confirm a one-question Socratic hint lands
     within ~2-3 seconds. Try 3 hints — the button should disable.
   - Type ≥5 words and submit. Coach panel should jump to **Review**
     and show the 10-20s loading state, then the full structured
     review.
   - Let the submission run: confirm in `pnpm db:studio` that a
     `Response` row, a `ScenarioCompletion`, and an updated `User`
     row (totalXp bumped, skillProgress extended) all land.
2. **Prompt quality review.** Read the first live review you get. If
   the narrative feels shallow, if strengths/gaps read generic, or if
   the commentary doesn't actually cite what you wrote, push back
   with an example — prompt tuning is iterative and the brief
   explicitly budgets for 2-3 rounds.
3. **Scenario content check.** Per the Sprint 2b brief, scenario
   weaknesses cap coach quality. Read at least one exemplar in full
   and flag any point that's ambiguous, outdated, or incomplete —
   we should fix before seeding more scenarios.

## Deviations from the Sprint 2b brief

1. **Brief routes return the "coach_offline" message inside the SSE
   envelope** rather than as a plain-text body. The client-side
   streamer treats it identically — both surfaces show a clear error
   card — and this keeps the SSE contract consistent so there's only
   one protocol to parse.
2. **Rate-limit count includes cached brief hits as free**, per your
   answer to the kick-off question. The brief's wording was "briefs
   don't change per user" which cache-hit-free counting honours
   literally.
3. **`/api/coach/review` is now the only submission endpoint** —
   `/api/responses` has been removed entirely per your answer.

## Stubbed / deferred

- **Prompt caching.** The Anthropic SDK supports `cache_control` for
  the persona / scenario context; Sprint 2b doesn't wire it. When
  token spend grows, adding it is a two-field change in each endpoint.
- **Streak updater.** `User.currentStreak` still doesn't increment on
  submit — Sprint 3's gamification scope.
- **Badge awards.** No coach-driven badge logic. Sprint 3.
- **Admin-facing cost dashboard.** `CoachUsage` is ready to query but
  nothing renders it yet.

## Prompt content — notes for your review

While writing the review prompt I leaned hard on the scenario YAMLs:

- For **scenario_001** (SAR, Bramble Lane) the exemplar is strong on
  the dual regime (UK GDPR + Education Regs) — the coach should be
  well-supported in scoring that dimension.
- For **scenario_002** (FOI, Hartwell) the exemplar takes a nuanced
  partial-disclosure view. The rubric criteria map cleanly to the
  exemplar's section structure, which should help the coach stay
  grounded.
- For **scenario_003** (DPIA, Meridian) the exemplar has the most
  moving parts. If coach reviews on this scenario feel surface-level,
  the fix is almost always to sharpen one rubric criterion
  description — the coach picks up on how specific the criterion
  description is.

Nothing to fix before Sprint 3, but worth your eyes.

## Dependencies added (all pre-cleared)

- `@anthropic-ai/sdk ^0.90`
- `react-markdown ^10.1`
- `remark-gfm ^4.0`

## Commits

- `chore(deps): add Sprint 2b dependencies`
- `chore(env): add .env.example with ANTHROPIC_API_KEY placeholder`
- `feat(db): CoachUsage model for per-day rate limit`
- `feat(coach): Anthropic client, prompt library, rate limiter`
- `feat(coach): /api/coach/brief SSE, /api/coach/hint, /api/coach/review`
- `feat(coach): wire coach panel tabs to live endpoints`
- `test(coach): prompt builder + review schema tests`
- `docs: SPRINT_2B_SUMMARY`

Branch: `claude/sprint-2b-ai-coach`.
