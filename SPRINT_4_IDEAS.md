# Sprint 4 Ideas — Deploy & Triage

Sprint 4 is **deploy-focused**: get Aegis on the internet on Vercel +
Supabase Postgres. Everything else below is a triage list for the
sprint *after* deploy, so we can prioritise against real usage instead
of speculation.

## Sprint 4 proper — scope

- **Vercel deployment** — production env vars (AUTH_URL, AUTH_SECRET,
  DATABASE_URL, RESEND_API_KEY, ANTHROPIC_API_KEY), production build
  pipeline, preview deployments for PRs.
- **Supabase Postgres migration** — run the Prisma migration fresh
  against Postgres, restore the proper `@default` values on the Json
  fields (`skillProgress: "{}"`, `badges: "[]"`, `goals: "[]"`) that
  SQLite couldn't accept, swap the `String` + `@db.Text` attributes
  back in.
- **Resend email flow** — verify sending domain, replace the
  dev-console magic-link banner with the actual Resend call path,
  test delivery end-to-end.
- **Mobile responsiveness pass** — the scenario workspace and the
  guide renderer are desktop-first today; at least ensure nothing
  breaks on phone-sized viewports.
- **Basic production hardening** — rate-limit sign-ins, add a
  `/healthz` endpoint, enable Next.js production telemetry off,
  confirm source maps are off.

**Exit criteria:** real URL, can sign in, can complete a scenario,
can read a guide and take a quiz, DB is Postgres.

## Post-deploy triage (a later sprint)

### Known debt from prior sprints

1. **Auth verification-token strict lookup** (Sprint 3b known debt).
   `auth.ts` currently overrides `useVerificationToken` to look up
   by token alone with a conditional identifier match. Root cause
   is Auth.js v5 dropping the `email` query param between the magic
   link and the callback handler. Investigate:
   - Is NextAuth v5 beta's Next.js wrapper stripping query params?
   - Is `@auth/core@0.41.2`'s `toInternalRequest` URL parser dropping
     them?
   - Is edge middleware doing URL normalisation that loses the param?

   Once identified, restore the strict compound-key lookup in the
   adapter.

2. **`reading_is_fundamental` badge bucket** — Sprint 3a added this
   badge as a stub. Sprint 3b wired it to real `GuideProgress`, so
   it now fires. Confirm after first production guide reads.

3. **`day_one` badge scoping** (Sprint 3a debt). Currently fires on
   any completion. Proper "within 24h of sign-up" scoping deferred
   until we have a wider sign-up window to test against.

4. **`no_stone_unturned` retroactive evaluation** (Sprint 3a debt).
   Per-completion rubric data isn't persisted on `ScenarioCompletion`
   today (only narrative lives on `Response`), so the badge only
   fires on the completion that triggers it. Add a rubric-audit
   table or denormalise per-criterion scores onto
   `ScenarioCompletion`.

### Content & engine improvements

5. **Governance skill tree.** Scenario 007 (Oakhaven retention
   review) is currently shoe-horned into `contract_vendor`. Adding
   a proper `governance` or `records_management` skill would earn
   its own slot. Ripple effect: update skill radar chart axes,
   skills page, weekly challenge rotation, and rebalance the seed
   scenario distribution.

6. **Multi-step / chained scenarios.** The brief mentions "chained
   scenarios (handle this, then a follow-up from the same client)"
   under difficulty modifiers — the Zod schema doesn't support
   them today. Possible shape: `parentScenarioId`, `stepOrder`,
   plus a UI tweak to show the chain as a mini-progress bar.

7. **Time-pressured variants.** Brief mentions these; schema has a
   `timeLimitMinutes` but no distinction between "normal" and
   "statutory deadline looming". Could be a modifier on the
   scenario plus a visual urgency treatment.

### UI polish deferred from 3a/3b

8. **Dashboard tooltip / streak-history popover / per-skill
   sparkline** — Sprint 3a deferred these as decorative hover
   states.

9. **Guide reader — mobile TOC.** The sticky TOC in
   `/learn/[slug]` is hidden below `lg`; mobile users have no
   navigation within a guide.

10. **Scenario response editor** — on very narrow screens the
    split-pane collapses poorly. Stack vertically with a toggle
    between email and editor view.

### Infra / DX

11. **Postgres-native Json defaults.** Once migrated, the
    NextAuth-adapter `createUser` override can drop its manual
    default injection.

12. **E2E tests for the sign-in flow.** The auth bug from 3a/3b
    would have been caught by a Playwright test that hits
    `/auth/signin`, grabs the dev-console magic link, and
    completes the sign-in. Add one.

13. **Coach response caching.** `/api/coach/brief` is static per
    scenario — cache the Anthropic response to disk (or Redis)
    keyed by scenario ID. Will materially cut Anthropic spend
    once we have real usage.

14. **Rubric-criterion score persistence.** Store per-criterion
    scores on `ScenarioCompletion` (currently only on the
    narrative `Response` row). Unlocks retroactive badge
    evaluation and proper skill analytics.

### Longer-term / brief-aligned

- **Leaderboards** (brief § 4) — global + weekly, XP earned,
  scenarios completed, skill mastery.
- **Boss scenario weekly** (brief § 4) — one multi-stage
  cross-client scenario per week with bonus XP.
- **BCS Practitioner mock track** (brief § 7) — exam-format
  question bank tied to the study track.
- **Design track work** — brief § 8 defers this to Sprint 3
  originally; still outstanding.
