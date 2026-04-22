# Sprint 2a Summary — Scenario Engine

## What shipped

### Content system (the product)

- **9 client YAMLs** under `content/clients/` — every fictional client named
  in PROJECT_BRIEF.md, with sector, description, logo initials, brand colour,
  and regulatory-context tag list. (Sprint 2a brief said "10"; the brief
  enumerates 9.)
- **3 fully-written scenario YAMLs** under `content/scenarios/`:
  - `scenario_001` — Bramble Lane Primary School · SAR handling · Tier 1.
    Exercises dual regime (UK GDPR + Education (Pupil Information) Regs
    2005), parental-responsibility verification with separated parents,
    Sch 3 Part 5 safeguarding exemption, third-party redaction.
  - `scenario_002` — Hartwell Borough Council · FOI decisions · Tier 2.
    Exercises FOIA ss.40 / 41 / 36 / 43 plus EIR overlay on politically
    sensitive councillor–developer correspondence with a live public
    interest test.
  - `scenario_003` — Meridian Capital Partners · DPIA authoring · Tier 3.
    Exercises Art 35 triggers, Art 22 (with IC-sign-off scrutiny),
    Art 6 / 9, Art 14 transparency, international transfer posture
    (DPF vs IDTA + TRA), and FCA SYSC touchpoints.

Each scenario includes a full realistic simulated email (~300–500 words
in the client's voice), attachments with excerpts, a rubric totalling 100
points, and an exemplar response written as a senior DPO's advice memo
(the framing you green-lit: DPO advising the client).

### Loaders (`lib/clients.ts`, `lib/scenarios.ts`)

- Read YAMLs at module-load time via `js-yaml`.
- Zod-validate with a schema matching the brief (client references,
  email format, tier literals, skill enum, positive integer caps).
- Cross-reference: every scenario's `client` must resolve to a known
  client. Every rubric must total 100. Duplicate ids throw.
- Module-scope caching — one read per process.
- Server-only by convention (use `node:fs`); importing from a client
  component fails at build time.

### Database + seed

- `prisma/seed.ts` now reads the YAML loader and upserts `Scenario` rows
  with real `title` / `tier` / `skill` / `clientId` / `difficulty` /
  `contentPath` (drops the Sprint 1 stub values).
- `lib/current-user.ts` — single-user shim returning the seeded user
  (`user_roy_local`). Every DB read goes through this so NextAuth can be
  dropped in with one change.
- DB round-trip verified at the end of this sprint: submitting a response
  persists a `Response`, creates a `ScenarioCompletion`, increments
  `User.totalXp` and the relevant `skillProgress[skill].xp`, and updates
  `level` + `lastActiveDate`.

### XP / level / skill library (`lib/xp.ts`)

- `calculateXpForLevel(level)` — cumulative, formula `sum of round(35 · n^1.5)`
  over levels 2…target. Fit to the brief's per-level anchors:
  - L1→2 target 100 / actual 99 — exact-ish
  - L5→6 target 500 / actual 514 — ~3% over
  - L12→13 target 2,000 / actual 1,641 — ~18% under
  - L30 cumulative ~69k vs brief's aspirational ~50k; the cumulative
    number is documented as aspirational and Sprint 3 can rebalance
    without breaking callers.
- `getLevelForXp(totalXp)` — inverse; capped at `MAX_LEVEL = 30`.
- `getTitleForLevel(level)` — returns the brief's six rank bands.
- `levelProgress(totalXp, level?)` — structured LevelBanner payload.
- `calculateScenarioXp({ xpBase, qualityScore, streak, isFirstTime })` —
  returns a full `ScenarioXpBreakdown` with the quality (0.5–1.5×),
  streak (up to +50% at 30 days), first-time (+25%), and perfect-score
  (+50 additive) components exposed individually.
- `getSkillXpForLevel(n)` / `getSkillLevelForXp(xp)` — steeper skill
  curve `round(50 · n^1.5)`, capped at `MAX_SKILL_LEVEL = 10`.

### Vitest suite

- `lib/xp.test.ts` — 30 tests covering: anchor fit within a ±25%
  tolerance band, monotonicity, round-trip consistency between
  `calculateXpForLevel` and `getLevelForXp`, title bands, level
  progress edge cases (max level, start of level), skill curve
  monotonicity and cap, scenario XP floors / ceilings / composition
  (including the perfect-score bonus), and input validation throws.
- `vitest.config.ts` — minimal; Node env, `@` → repo root alias so the
  xp import works without extra plugins.
- New scripts: `pnpm test` (run) and `pnpm test:watch`.

### Inbox (`/inbox` + `/api/scenarios`)

- **Three-pane layout** — folder nav / scenario list / reading pane.
  On desktop three panes side-by-side; on mobile the list and reading
  pane swap via state (back link at the top of the reading pane).
- Folder nav: All / Today / This Week / By Client / By Skill.
  "Today" and "This Week" share the "All" list in 2a (no deadline
  concept yet); "By Client" and "By Skill" add header groupings.
- Scenario list rows: client-coloured initials tile, sender name,
  subject, one-line preview, tier pill (I / II / III with accent
  colour), skill tag, XP reward, time estimate.
- Reading pane: full email headers, serif body, attachment cards with
  click-to-reveal excerpts, and a **Start scenario** CTA that routes
  to `/scenario/[id]`.
- `/api/scenarios` GET returns the scenario + client summary payload
  (static-generated at build; client components could fetch if needed,
  but the page reads the loader directly in RSC).

### Scenario workspace (`/scenario/[id]`)

- Sticky header: back to inbox, title, client / tier / skill badges,
  live elapsed-time timer (mm:ss, pauses on submit).
- **Two-column workspace** — email on the left, response editor on the
  right, stacked on mobile.
  - Left: sender block, subject, serif email body, collapsible
    attachments, and a "View briefing" toggle that reveals the
    YAML briefing inline beneath the email.
  - Right: a **Tiptap** editor with StarterKit plus a custom toolbar
    (H2, bold, italic, bullets, ordered list, blockquote, undo / redo),
    a live word count, and a submit button disabled under 5 words.
- **Coach panel** — sticky collapsible drawer at the bottom with three
  tabs:
  - **Briefing** — shows the YAML briefing (request type, what you
    need to know, common pitfalls).
  - **Hint** — hardcoded Sprint 2a stub directing the user to re-read
    the briefing.
  - **Review** — hidden until submission. After submit, the panel
    jumps to this tab and renders the rubric breakdown (per-criterion
    progress bars), overall score, XP breakdown (base × quality ×
    streak × first-time + perfect-score bonus), the stub narrative,
    and a collapsible exemplar-response preview.
- On submit, the editor disables, the timer pauses, and the workspace
  footer shows a **Next scenario** link (or **Back to inbox** when
  nothing else is queued).
- Unknown IDs correctly 404 via `notFound()`.

### Responses API (`/api/responses`)

- POST only; Zod-validated body (`{ scenarioId, userAnswer,
  userAnswerText, timeSpentSec }`).
- Computes the Sprint 2a stub review:
  - Per-criterion score = `round(75% · maxPoints)`.
  - Overall score = sum (gives ~74/100 by design; stays round-trip
    consistent with the per-row values the UI displays).
- Computes real XP via `calculateScenarioXp` using the brief's streak
  and first-time stubs (`streak = user.currentStreak`, `isFirstTime`
  derived from whether a prior completion exists).
- Transactionally writes a `Response`, a `ScenarioCompletion`, and
  updates the user's `totalXp`, `level`, `skillProgress[skill]`, and
  `lastActiveDate`.
- Picks the next scenario id the user hasn't yet completed.

### Dashboard wired to the DB

- `app/page.tsx` now reads the current user via `getCurrentUser()` and
  the scenario list via the YAML loader (joined with the Prisma
  `ScenarioCompletion` list to deprioritise completed scenarios).
- `LevelBanner`, `StreakCounter`, `SkillRadarChart`, `TodaysInbox`, and
  `RecentAchievements` all render real DB state. `WeeklyChallenge` is
  still a static placeholder.
- `skillProgress` Json is coerced safely — unknown shapes fall back to
  the empty progress record.

## Acceptance — personally verified

| # | Check | Result |
| - | ----- | ------ |
| 1 | `pnpm dev` starts clean, no console errors on any page | ✅ |
| 2 | `pnpm lint` passes clean | ✅ |
| 3 | `pnpm typecheck` passes | ✅ |
| 4 | `pnpm build` passes | ✅ clean, no warnings |
| 5 | `pnpm test` — all `xp.ts` tests pass | ✅ 30/30 |
| 6 | Three scenarios load from YAML, seed into DB, show in the inbox | ✅ confirmed via a direct Prisma read |
| 7 | Clicking a scenario opens the email reading pane | ⚠️ code verified; needs your eyes |
| 8 | "Start Scenario" navigates to `/scenario/[id]` and the workspace renders | ✅ `/scenario/scenario_001/2/3` all returned 200; `/scenario/does_not_exist` correctly 404s |
| 9 | Submitting a response persists to DB | ✅ confirmed: `Response` row, `ScenarioCompletion` row, `User.totalXp` bumped 0→78, `skillProgress.sar_handling.xp` = 78 |
| 10 | Dashboard shows real data not mock | ✅ DB-driven |
| 11 | Dark mode still works | ⚠️ code unchanged since Sprint 1; needs visual re-confirmation |
| 12 | Mobile layout holds up at 400px | ⚠️ Tailwind responsive classes in place (`md:` breakpoints on inbox three-pane and scenario two-column); needs your eyes at 400px |

### Please eyes-on before Sprint 2b

1. Inbox at desktop + 400px mobile width — confirm the mobile flow
   (list ↔ reading pane) toggles correctly.
2. Scenario workspace — type a response, submit, confirm:
   - Timer pauses at submit
   - Coach panel jumps to Review tab and populates
   - "Next scenario" routes correctly
   - Exemplar response collapsible reveals cleanly
3. Dark-mode pass on inbox and scenario workspace (new surfaces).
4. Read one of the three scenarios fully and tell me if the legal
   substance is the right depth for its tier. If any exemplar looks
   thin or misses a point, fix before Sprint 2b — the coach will
   generate feedback against these, so the exemplar quality caps
   the coach's quality.

## Deviations from the Sprint 2a brief

1. **9 client YAMLs, not 10.** The PROJECT_BRIEF enumerates 9 clients
   (3 per tier); the Sprint 2a prompt's "ALL 10 clients" is a typo.
   No invented content to reach 10.
2. **Scenario 003 rubric has 8 criteria, not the 5–7 band in the
   brief's YAML spec.** Deliberate — the legal complexity genuinely
   splits into 8 coherent scored components and folding any of them
   in would reduce teaching value. You green-lit this in the
   outline review.
3. **`--downlevelIteration` fix, not a tsconfig bump.** The sprint
   introduced a couple of `Set`/`Map` iteration sites. Rather than
   change the Sprint 1 tsconfig target, I rewrote to
   `Array.from(...)`. Zero semantic impact, minimal diff.
4. **No `server-only` package import.** I didn't pre-clear it and
   it's a thin safeguard only; relying on the "uses node:fs" +
   no `"use client"` convention instead.

## Stubbed for Sprint 2b

- **The coach itself.** Briefing tab shows the YAML briefing directly;
  Hint tab shows a hardcoded stub; Review generates a deterministic
  per-criterion score at 75% and a placeholder narrative. All
  replaceable wholesale in 2b.
- **First-time / streak logic.** The `calculateScenarioXp` function
  honours both; but `isFirstTime` is derived from existing completions
  only (good enough), and `streak` comes from `user.currentStreak`
  which has no updater yet — so every submit sees `streak = 0`.
  Sprint 3 streak logic will bring this to life.
- **Weekly challenge.** Static "coming soon" card.
- **Badge awards.** No scenario triggers a badge yet. First Blood etc.
  are scoped for Sprint 3 gamification.
- **Scenario deadlines.** Inbox folders `Today` / `This Week` share
  the `All` list — there's no deadline concept yet.
- **DPF certification check and real transfer lookups** in
  scenario_003's exemplar — the exemplar gives the right analysis
  but leaves DPF status as a "check the certified list" instruction,
  which is the honest DPO answer.

## Dependencies added (all pre-cleared)

- Runtime: `zod@4.3`, `js-yaml@4.1`, `@tiptap/react@3.22`,
  `@tiptap/starter-kit@3.22`, `@tiptap/pm@3.22`.
- Dev: `vitest@4.1`, `@testing-library/react@16.3`, `@types/js-yaml@4.0`.

## Commits

- `chore(deps): add Sprint 2a dependencies`
- `feat(content): 9 client YAMLs and 3 full scenario YAMLs`
- `feat(content-loaders): Zod-validated YAML loaders`
- `feat(db): read scenarios from YAML in seed; add current-user shim`
- `feat(xp): full level + skill + scenario XP math with Vitest suite`
- `feat(inbox): three-pane inbox + /api/scenarios`
- `feat(scenario): workspace + Tiptap editor + coach panel + /api/responses`
- `feat(dashboard): wire to real DB reads`
- `docs: SPRINT_2A_SUMMARY`

## Branch

All work is on `claude/sprint-2a-scenario-engine` branched from
`claude/add-gamification-tiers-dwDl7` (Sprint 1).
