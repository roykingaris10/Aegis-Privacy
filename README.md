# Aegis

A gamified, scenario-based data protection training platform. Users play a
DPO at a fictional consultancy, work through an inbox of simulated client
scenarios, get AI-coached on each one, and level up as they master the
profession.

See [PROJECT_BRIEF.md](./PROJECT_BRIEF.md) for the full vision, tier system,
scenario taxonomy, and multi-sprint roadmap.

## Status

**Sprint 1 — Foundation.** Scaffolded shell with a mock-data dashboard,
database primed, and placeholder routes for the Sprint 2 / 3 surface area.

## Tech stack

- **Next.js 14** (App Router) + **TypeScript** (strict)
- **Tailwind CSS** + **shadcn/ui** (new-york style, neutral base)
- **Prisma 6** ORM with **SQLite** for local dev (Postgres/Supabase in Sprint 4)
- **recharts** for the skill radar chart
- **next-themes** for dark / light mode
- **Inter** via `next/font/google`
- **pnpm** package manager
- **ESLint** + **Prettier**

## Local setup

```bash
# 1. Install dependencies
pnpm install

# 2. Create the SQLite database and run migrations
pnpm db:migrate          # first time, creates prisma/dev.db

# 3. Seed the test user + 3 stub scenarios
pnpm db:seed

# 4. Start the dev server
pnpm dev                 # http://localhost:3000
```

## Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start the Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint (`next lint`) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier write |
| `pnpm format:check` | Prettier check |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:push` | `prisma db push` (no-migration dev sync) |
| `pnpm db:seed` | Run `prisma/seed.ts` via tsx |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:generate` | Regenerate the Prisma client |

## Folder structure

```
.
├── app/                       Next.js App Router
│   ├── page.tsx               Dashboard (mock data in Sprint 1)
│   ├── inbox/                 Sprint 2 placeholder
│   ├── learn/                 Sprint 3 placeholder
│   ├── profile/               Sprint 3 placeholder
│   ├── scenario/[id]/         Sprint 2 placeholder
│   ├── layout.tsx             Root shell: sidebar + topbar + theme provider
│   └── globals.css            Tailwind entry + shadcn CSS variables
├── components/
│   ├── dashboard/             Dashboard widgets (LevelBanner, radar, etc.)
│   ├── ui/                    shadcn/ui primitives
│   ├── sidebar.tsx            Left nav
│   ├── topbar.tsx             Top bar with theme toggle + avatar
│   ├── theme-provider.tsx     next-themes wrapper
│   ├── theme-toggle.tsx       Light / Dark / System menu
│   └── placeholder-page.tsx   Shared placeholder for Sprint 2/3 routes
├── content/
│   ├── scenarios/             YAML scenarios (Sprint 2 content)
│   ├── clients/               YAML client descriptions
│   └── guides/                MDX learning resources
├── lib/
│   ├── db.ts                  Prisma singleton
│   ├── utils.ts               `cn` helper (clsx + tailwind-merge)
│   ├── skills.ts              10 skill trees + empty-progress helper
│   └── xp.ts                  Level curve, titles, progress helper
├── prisma/
│   ├── schema.prisma          Data model
│   ├── seed.ts                Seeds test user + 3 stub scenarios
│   └── migrations/            Prisma migrations
├── PROJECT_BRIEF.md           Full product vision
└── SPRINT_1_SUMMARY.md        What shipped this sprint
```

## Environment

Default local env is in `.env`:

```
DATABASE_URL="file:./dev.db"
```

## What's next

Sprint 2 will wire up the dashboard to the database, build the inbox, the
scenario workspace, and the first cut of the AI coach against Anthropic's
Claude API. See `PROJECT_BRIEF.md § 9` for the full sequence.
