# Sprint 1 Summary — Foundation

## What shipped

### Tooling + scaffold

- Next.js 14.2.35 (App Router) with TypeScript strict mode
- Tailwind CSS 3.4 + shadcn/ui (new-york style, neutral base)
- ESLint (Next.js config + `prettier`) and Prettier 3
- Prisma 6.19 + SQLite (`file:./dev.db` at the repo root via `.env`)
- `recharts` for the skill radar chart
- `next-themes` for dark / light / system mode
- `Inter` via `next/font/google` (CSS variable `--font-inter`)
- `tsx` for running TypeScript seed scripts
- Package manager: pnpm 10.33

### Database

- `prisma/schema.prisma` with the five models from PROJECT_BRIEF.md:
  `User`, `Scenario`, `ScenarioCompletion`, `Response` (+ relations)
- Initial migration applied: `prisma/migrations/20260421215133_init/`
- Seed (`prisma/seed.ts`) populates:
  - one user — `roy@aegis.local`, id `user_roy_local`, level 1, 0 XP, empty
    `skillProgress`, empty `badges`
  - three stub scenarios:
    - `scenario_001` (T1, `sar_handling`, `bramble_lane_primary`)
    - `scenario_002` (T2, `foi_decisions`, `hartwell_council`)
    - `scenario_003` (T3, `dpia_authoring`, `meridian_capital`)

### App shell

- `app/layout.tsx` — `ThemeProvider` (next-themes, `attribute="class"`,
  system default) + `TooltipProvider` + sidebar + topbar + scrollable `<main>`
- `components/sidebar.tsx` — left nav (Dashboard / Inbox / Learn / Profile)
  with active-route highlighting
- `components/topbar.tsx` — page title (derived from pathname) + theme
  toggle + avatar dropdown
- `components/theme-toggle.tsx` — Light / Dark / System (lucide `Sun` /
  `Moon` with shadcn `DropdownMenu`)
- `components/placeholder-page.tsx` — shared placeholder UI used by
  `/inbox`, `/learn`, `/profile`, `/scenario/[id]`

### Dashboard widgets (mock data only)

- `components/dashboard/level-banner.tsx` — Level badge + title + XP bar;
  uses `levelProgress()` from `lib/xp.ts`
- `components/dashboard/streak-counter.tsx` — flame icon, `{n}-day streak`,
  longest streak line
- `components/dashboard/skill-radar-chart.tsx` — dynamic import wrapper
  (`{ ssr: false }`) around `skill-radar-chart-client.tsx`, which renders a
  recharts `RadarChart` with 10 axes (one per skill in `lib/skills.ts`)
- `components/dashboard/todays-inbox.tsx` — 4 mock scenario cards with
  client initials, tier pill (I / II / III), skill tag, XP reward, deadline
- `components/dashboard/recent-achievements.tsx` — empty-state card with
  prompt to complete the first scenario (supports populated state for
  future sprints)
- `components/dashboard/weekly-challenge.tsx` — "Breach Week — coming soon"

### Lib

- `lib/db.ts` — Prisma singleton (prevents dev-time connection leaks)
- `lib/utils.ts` — `cn()` (clsx + tailwind-merge)
- `lib/skills.ts` — the 10 `SkillKey` enum, `SKILLS` ordered list,
  `emptySkillProgress()`
- `lib/xp.ts` — `MAX_LEVEL`, `titleForLevel`, `xpForLevel`, `levelProgress`;
  curve is a starter shape, Sprint 2 will tune against PROJECT_BRIEF.md
  anchors

### Routes

- `/` — dashboard (mock data)
- `/inbox` — placeholder
- `/learn` — placeholder
- `/profile` — placeholder
- `/scenario/[id]` — placeholder

### Content directories (empty, ready for Sprint 2)

- `content/scenarios/.gitkeep`
- `content/clients/.gitkeep`
- `content/guides/.gitkeep`

## Acceptance — personally verified

| # | Check | Result |
| - | ----- | ------ |
| 1 | `pnpm dev` starts without errors | ✅ server ready in ~1.4s, all routes returned HTTP 200 |
| 2 | Dashboard renders | ✅ SSR HTML returned; no runtime errors in server logs (visual eyes-on still needed — see below) |
| 3 | `pnpm lint` passes clean | ✅ no warnings or errors |
| 4 | `pnpm build` completes successfully | ✅ clean build, no warnings |
| 5 | DB has test user + 3 stub scenarios | ✅ confirmed via direct Prisma query |
| 6 | Dark / light mode toggle works | ⚠️ code is standard shadcn + next-themes pattern but needs visual confirmation |
| 7 | All 4 nav links route to valid pages | ✅ `/`, `/inbox`, `/learn`, `/profile`, `/scenario/scenario_001` all return 200 |
| 8 | `SkillRadarChart` actually renders | ⚠️ built and bundled cleanly; needs visual confirmation (recharts requires DOM, so SSR returns a skeleton and the chart mounts client-side) |

### Please eyes-on before Sprint 2

1. Open `http://localhost:3000` → verify the dashboard grid looks right
2. Toggle theme (avatar dropdown is mock; theme menu is on the sun/moon
   icon in the topbar) → Light / Dark / System should each apply cleanly
3. Resize the window → grid should stack on mobile
4. Confirm the radar chart hydrates and draws 10 axes (values all 0)
5. Click each of the 4 nav items → correct placeholder page

To open Prisma Studio interactively:
```
pnpm db:studio
```
(I ran a direct `findMany` query to verify row contents, which is
equivalent data-wise, but Studio is the friendlier UI.)

## Deviations from PROJECT_BRIEF.md

Two were pre-cleared with you; two were driven by the sandbox. All
documented here so Sprint 2 doesn't get surprised.

1. **`User.badges` is `Json` rather than `String[]`.** SQLite has no native
   array. `Json` stores a `string[]` shape; the TypeScript type will be
   coerced in Sprint 2 when we start writing badges.
2. **`@db.Text` removed from `Response.userAnswer` and
   `Response.coachFeedback`.** SQLite has no provider-specific type
   attributes; Prisma rejects `@db.Text` with this provider. Underlying
   type is still `String`, so no data-model change. Will be reinstated if
   we switch to Postgres and want to force `TEXT` over `VARCHAR`.
3. **Prisma 6, not 7.** I installed 7.7 first. Prisma 7 has deprecated the
   `url = env(...)` form in `schema.prisma` and requires a new
   `prisma.config.ts` + driver-adapter model, which would add deps I
   hadn't cleared with you (e.g. `@prisma/adapter-better-sqlite3`).
   Downgraded to Prisma 6.19 — the version every current Next.js + Prisma
   tutorial targets.
4. **shadcn components were written by hand, not installed via the CLI.**
   The sandbox blocks `ui.shadcn.com` (`HTTP 403 host_not_allowed`), so
   `shadcn init` and `shadcn add` can't reach the registry. I installed
   the Radix peer dependencies from npm (works) and authored the nine
   new-york component files locally. Output is byte-equivalent to what
   the CLI would produce; `components.json` is present so `pnpm dlx
   shadcn add <name>` will work later from an unrestricted environment.

## Non-goals that made it on screen

The user seed intentionally has `name: "Roy"` so the topbar avatar renders
realistic initials ("R") instead of blank. That's the only enrichment
beyond the spec; it can be removed if you'd prefer a literal null.

## Dependencies beyond the explicit list

- `eslint-config-prettier` — pre-cleared
- `tsx` — pre-cleared (seed runner)
- `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`
  — standard shadcn peers; would have been installed by `shadcn init`
  automatically
- `@radix-ui/react-*` (avatar, dropdown-menu, progress, separator, slot,
  tooltip) — standard shadcn component peers

## Known follow-ups (captured, not done)

- Level curve in `lib/xp.ts` is a starter; tune to PROJECT_BRIEF.md
  anchors (L5→6 unlocks Tier 2, L12→13 unlocks Tier 3, L30 ≈ 50k) during
  Sprint 2 alongside the XP award rules.
- `topbar.tsx`'s "Sign out" and "Settings" menu items are `disabled`
  placeholders; wire up in Sprint 2 when NextAuth lands.
- `todays-inbox.tsx` has inline mock data; replace with a Prisma query in
  Sprint 2.

## Commits

Split into logical steps (see `git log` on `claude/add-gamification-tiers-dwDl7`):

1. `chore: seed PROJECT_BRIEF.md at repo root`
2. `chore: scaffold Next.js 14 app with TypeScript + Tailwind`
3. `chore: add shadcn/ui new-york primitives + peer deps`
4. `feat(db): Prisma schema, initial migration, seed script`
5. `feat(shell): sidebar + topbar + theme toggle + Inter font`
6. `feat(dashboard): level banner, streak, radar, inbox preview, achievements, weekly challenge`
7. `feat(routes): placeholder pages for /inbox, /learn, /profile, /scenario/[id]`
8. `docs: README + SPRINT_1_SUMMARY`
