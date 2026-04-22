# Sprint 3a Summary — Auth + Gamification Polish

Sprint 3a turns Aegis from "works for a hardcoded dev user" into a proper
multi-user platform. Magic-link auth via NextAuth, real streak math,
badge awarding, onboarding flow, and a profile section with skill trees,
a badge grid, and a 90-day activity calendar.

## What shipped

### Authentication

- **NextAuth v5 (Auth.js)** with a split config:
  - `auth.config.ts` — edge-safe, no adapter, used by `middleware.ts`.
  - `auth.ts` — full config with the Prisma adapter + Resend email
    provider, used by API routes and server components.
- **Session strategy: JWT** (not database as the brief's starting point
  suggested — see Deviations). Works across edge middleware without
  pulling Prisma into the edge bundle.
- **Magic-link email flow** with a custom `sendVerificationRequest`
  that sends via Resend when `RESEND_API_KEY` is set, otherwise logs
  the link to the dev console so local testing doesn't need a Resend
  account.
- **Prisma adapter wrapper** that injects the Aegis-specific
  non-nullable defaults (`skillProgress: {}`, `badges: []`, `goals: []`)
  on `createUser`.
- **Middleware (`middleware.ts`)** protects every route except
  `/auth/*`, `/api/auth/*`, and Next.js assets. Unauthenticated
  requests get redirected to `/auth/signin?callbackUrl=<original>`.
- **Sign-in / verify-request / error pages** at `/auth/signin`,
  `/auth/verify-request`, `/auth/error`, styled to match the rest of
  the app.
- **Topbar** now uses `useSession()`, shows the signed-in user's email
  and initials, and the **Sign out** menu item is wired to
  `signOut({ callbackUrl: "/auth/signin" })`.
- **`lib/current-user.ts`** replaced: it now resolves the user from
  the session, throws `UnauthorizedError` if missing, and the seeded
  `roy@aegis.local` user is preserved on real sign-in via the Prisma
  adapter's email-lookup.

### Schema

- Added NextAuth tables: `Account`, `Session`, `VerificationToken`.
- Added Aegis fields on `User`: `emailVerified`, `image`, `specialism`,
  `goals` (Json), `onboardedAt`.
- `User.id` now has `@default(cuid())` so magic-link sign-in creates
  rows without a caller-supplied id.
- Migration: `20260422132607_sprint_3a_auth_onboarding`.

### Onboarding

- `/onboarding` — server-side check: redirects to `/` if
  `user.onboardedAt` is already set.
- Three-step client flow: Welcome → Specialism (radio cards) → Goals
  (multi-select). Persists `specialism` and `goals` via
  `POST /api/onboarding`.
- On finish, redirects to `/?welcome=1` — the dashboard's
  `<WelcomeConfetti>` component fires two small confetti bursts
  (via `canvas-confetti`) and a welcome toast, then strips the query
  param so reload doesn't re-fire.

### Streaks (`lib/streak.ts`)

- `updateStreak(state, completedAt)` — pure function returning the
  new `currentStreak`, `longestStreak`, `lastActiveDate`, plus a
  `milestone` field (3 / 7 / 14 / 30 / 60 / 100) for toast triggers.
- Rules: UTC day boundaries; same-day repeats are no-ops; gap of 1
  day increments; gap ≥ 2 resets to 1; `longestStreak` never shrinks;
  out-of-order inputs are no-ops.
- Wired into `/api/coach/review` — the streak is updated inside the
  same DB transaction as the completion.
- **17 Vitest tests** covering every edge case called out in the
  Sprint 3a brief.

### Badges (`lib/badges.ts`)

- 15 seed badges across 4 rarity bands:
  - **Common (5)**: First Blood, Getting Started, Day One, Reading Is
    Fundamental (stub until guides ship), Streak Beginner.
  - **Uncommon (5)**: Perfect Score, Tier Climber, Skill Starter,
    Streak Keeper, All-Rounder.
  - **Rare (4)**: No Stone Unturned, Firefighter, Tier III Unlocked,
    Streak Master.
  - **Legendary (1)**: Polymath.
- Each badge has a `criteria(stats): boolean` predicate; the registry
  has no side effects.
- `newlyAwardedBadges(stats, existing)` returns badges the user newly
  qualifies for; wired into `/api/coach/review` post-completion and
  persisted in the same transaction.
- **17 Vitest tests** — every badge has a positive and a negative case.

### Toast queue (`lib/toasts.ts`)

- Client helpers for XP, skill-level-up, user-level-up, streak
  milestone, tier unlock, and badge unlock.
- `queueToasts([fn, fn, …])` fires each factory 1.5 s apart so a
  single submission that triggers level-up + a badge + a streak
  milestone doesn't stack them unreadably.
- Used from `scenario-workspace.tsx` after a successful review.

### Dashboard refinements

- **Smart Today's Inbox** (`lib/recommendations.ts`): fewer-than-3
  completions → four Tier 1 picks; otherwise one strongest-skill
  quick win, one weakest-skill growth, one current-tier stretch, one
  next-tier preview. Falls back gracefully when the pool is small
  (current state with 3 seed scenarios).
- **Weekly Challenge** now rotates deterministically by ISO week
  number through the ten skills (`lib/weekly-challenge.ts`).
  Description flips each Monday in UTC.
- **Recent Achievements** now pulls real badge data from the
  registry, rendering the last three earned with their descriptions.
- **Welcome confetti** trigger on first post-onboarding visit.

### Profile section

- `/profile` — user card, four stat tiles (scenarios completed, avg
  score, total XP, longest streak), 90-day activity calendar
  (`react-activity-calendar`) coloured by daily XP, account card with
  email / specialism / goals.
- `/profile/skills` — grid of ten skill cards: name, count of
  scenarios completed in that skill, current level badge, XP progress
  bar to next level, "Practice this skill" button that deep-links to
  `/inbox?skill=<key>`. Untouched skills render muted.
- `/profile/badges` — 15-card grid; unlocked badges in rarity colour
  (slate / emerald / blue / amber), locked badges dimmed with
  criteria visible so the user can see what they're chasing.
- Subnav component (`<ProfileSubnav>`) ties the three pages together.

## Acceptance — self-verified

| # | Check | Result |
| - | ----- | ------ |
| 1 | `pnpm lint` | ✅ clean |
| 2 | `pnpm typecheck` | ✅ clean |
| 3 | `pnpm build` | ✅ 18 routes, no warnings |
| 4 | `pnpm test` | ✅ 95 / 95 |
| 5 | Fresh (no-cookie) `GET /` → 307 redirect to `/auth/signin?callbackUrl=%2F` | ✅ |
| 6 | Same for `/profile`, `/profile/skills`, `/profile/badges`, `/onboarding`, `/scenario/[id]` | ✅ |
| 7 | `/auth/signin`, `/auth/verify-request`, `/auth/error` reachable unauthenticated | ✅ |
| 8 | `/api/scenarios` (public by design) reachable unauthenticated | ✅ |
| 9 | Streak unit tests cover all 6 edge cases called out in the brief | ✅ (17 tests) |
| 10 | Badges — positive and negative case for every badge | ✅ (17 tests) |

### Needs your eyes (can't verify headless)

1. Open http://localhost:3000. You should land on `/auth/signin`.
2. Type any email (e.g. `roy@aegis.local` to reuse the seeded user) →
   click **Send sign-in link**. Check the **dev terminal** — the
   magic link is printed between two `━` lines.
3. Click the link. You should land on the dashboard (or `/onboarding`
   if a new user).
4. Complete onboarding → dashboard with confetti + welcome toast.
5. Complete a scenario — watch the XP toast first, then any level-up
   / skill-up / badge / streak-milestone toasts queue 1.5 s apart.
6. Open `pnpm db:studio` and confirm `User.currentStreak`, `badges`,
   `specialism`, `goals`, `onboardedAt` all populated.
7. Sign out from the topbar → confirm you're back at `/auth/signin`.

## Deviations from the brief

1. **Session strategy: JWT, not database.** The brief said "database
   — we'll be reading user state anyway". With the split edge/node
   NextAuth config required to keep Prisma out of the middleware
   bundle, a DB-backed session would force every middleware hop to
   hit Prisma (and edge can't). JWT keeps session state in a signed
   cookie; user records still exist and the Prisma adapter still
   handles sign-in. The practical loss is revocable sessions —
   acceptable for a single-user training app; revisit if we add
   shared accounts.
2. **Prisma Json defaults not declared in the schema.** SQLite +
   Prisma rejects `@default("[]")` / `@default("{}")` syntax; we
   inject the defaults in the adapter's `createUser` override and in
   the seed. Postgres migration at deploy time can add them back.
3. **Dashboard tooltip / streak-history popover / per-skill
   sparkline** deferred. The core dashboard is wired to real data
   and the recommendation algorithm, rotation, and confetti landed;
   the purely decorative hover states didn't make it in. Flagged in
   SPRINT_3B_IDEAS.md as deferred polish rather than cut work.

## Stubbed / deferred to later sprints

- **`reading_is_fundamental` badge** will only trigger once the
  Sprint 3b guide reader lands and flips `stats.viewedAnyGuide`.
  Today it's in the registry but permanently unearned.
- **`day_one` badge** is awarded on any completion; the brief's
  literal "within 24 h of sign-up" scoping is deferred for a pass
  later when we know users span a wider sign-up window.
- **`no_stone_unturned` re-evaluation on older completions** —
  per-completion rubric data isn't persisted today (only the narrative
  lives on `Response`), so the badge only fires on the current
  completion. Flagged for Sprint 4 alongside a rubric-audit table.

## Dependencies added (pre-cleared in the kick-off)

- `next-auth@5.0.0-beta.31`, `@auth/prisma-adapter@2.11`, `resend@6.12`
- `sonner@2.0`
- `canvas-confetti@1.9` + `@types/canvas-confetti`
- `react-activity-calendar@3.2`

## Commits

- `chore(deps): Sprint 3a dependencies`
- `chore(env): .env + .env.example for AUTH_SECRET / AUTH_URL / RESEND`
- `feat(db): NextAuth + onboarding schema additions`
- `feat(auth): NextAuth v5 (JWT) with Resend + dev console fallback`
- `feat(auth): sign-in / verify-request / error pages; session wiring`
- `feat(onboarding): 3-step flow + welcome confetti`
- `feat(streak): pure streak math + Vitest; wired into /api/coach/review`
- `feat(badges): 15-badge registry + Vitest; award on completion`
- `feat(dashboard): smart reco + weekly rotation + post-submit toast queue`
- `feat(profile): overview + 90-day calendar + skills + badges`
- `docs: SPRINT_3A_SUMMARY`

Branch: `claude/sprint-3a-auth-gamification`.
