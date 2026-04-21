# Aegis — Data Protection Training Platform

> **Tagline:** Practise real data protection scenarios. Level up like a game.
> Master the profession.

## 1. Concept

A gamified, scenario-based training platform where the user plays a Data
Protection Officer at a fictional consultancy called **Aegis Privacy Partners**.
They work through an inbox of requests from client companies, get AI-coached
before and after each task, and level up as they master different request
types. Difficulty scales automatically — easy companies/scenarios unlock
medium, medium unlocks hard.

## 2. Core loop

1. User logs in → sees dashboard (streak, level, XP, skill progress).
2. Opens inbox → daily scenarios waiting.
3. Selects a scenario → coach briefs them on the request type and applicable
   law (doesn't give the answer).
4. User drafts their response (DPIA / SAR response / FOI decision / breach
   assessment / etc.).
5. Coach reviews their response against a rubric, awards XP, flags gaps,
   shows how a senior DPO would have handled it.
6. Stats update, skills level up, new content unlocks.

## 3. Tier / difficulty system

Three tiers of client company, unlocking as the user levels up.

### Tier 1 — Starter Clients (Level 1–5)

Smaller organisations, lower-stakes requests, clear-cut decisions.

- **Bramble Lane Primary School** — small school; parent SARs, children's
  data basics, CCTV queries.
- **Oakhaven Community Library Trust** — small charity; basic SARs, simple
  FOI, straightforward retention queries.
- **Fernwood Dental Practice** — small health provider; patient SARs, basic
  breach handling, simple consent queries.

### Tier 2 — Mid-Market Clients (Level 6–12)

Medium organisations, more regulatory complexity, multi-faceted decisions.

- **Hartwell Borough Council** — local authority; FOI-heavy, elected member
  queries, social services data, Schedule 3.
- **Silverbrook Care Group** — residential care; safeguarding data,
  families, CQC, Schedule 2 & 3 exemptions, court orders.
- **Polaris EdTech Ltd** — SaaS EdTech startup; children's data, DUAA
  compliance, international transfers, AI features.

### Tier 3 — Enterprise Clients (Level 13+)

Large, regulated organisations, high-stakes multi-layered scenarios.

- **Meridian Capital Partners** — investment firm; FCA overlay, complex
  transfers, M&A due diligence, automated decision-making, SCCs/IDTAs.
- **Lanely NHS Foundation Trust** — healthcare; special category data,
  research, Section 251, police disclosures, major breaches.
- **Aurelia Biotech plc** — pharma/research; clinical trial data,
  international research collaborations, AI in drug discovery, regulator
  liaison.

### Difficulty modifiers within tiers

- Straightforward / Complex / Contested (scales reward XP).
- Time-pressured variants (statutory deadline looming).
- Chained scenarios (handle this, then a follow-up from the same client).

## 4. Gamification system

### Experience Points (XP)

- Complete scenario: base XP by tier (T1 = 50, T2 = 100, T3 = 200).
- Quality score (coach rubric): multiplier from 0.5× to 1.5×.
- Time bonus: handled within realistic timeframe = +10%.
- Streak bonus: daily streak multiplies XP (up to +50% at 30 days).
- First-time request type: +25% "new ground" bonus.
- Perfect score: +50 bonus XP.

### Levels

Level 1–30 system with curve:

- Level 1→2: 100 XP.
- Level 5→6: 500 XP (unlocks Tier 2 clients).
- Level 12→13: 2,000 XP (unlocks Tier 3 clients).
- Level 30: ~50,000 XP total (aspirational endgame — "Senior DPO" title).

### Titles / Ranks (unlocked by level)

- Level 1–3: Trainee Data Protection Officer
- Level 4–7: Data Protection Practitioner
- Level 8–12: Data Protection Specialist
- Level 13–18: Senior Data Protection Officer
- Level 19–24: Lead Data Protection Officer
- Level 25–30: Chief Privacy Officer

### Skill trees (separate XP bars per skill)

Each skill levels independently 1–10 based on scenarios of that type.

1. SAR Handling (individual rights requests)
2. FOI Decisions (public sector access)
3. DPIA Authoring (impact assessments)
4. Breach Response (incident management)
5. International Transfers (SCCs, IDTAs, adequacy)
6. Contract & Vendor Management (DPAs, processor agreements)
7. PECR & Marketing (e-privacy)
8. Children's Data (age assurance, consent, DUAA)
9. AI Governance (Article 22, EU AI Act, automated decisions)
10. Regulator Liaison (ICO correspondence, complaints, enforcement)

### Achievements / badges

Unlocked for specific milestones:

- **First Blood** — complete your first scenario.
- **Perfect Redactor** — score 100% on 5 SAR redaction tasks.
- **No Stone Unturned** — identify every exemption in a complex SAR.
- **Firefighter** — handle a 72-hour breach notification correctly.
- **Global Citizen** — complete transfer scenarios across 5 jurisdictions.
- **Regulator's Favourite** — draft 3 ICO responses scored "Excellent".
- **Streak Master** — 30-day streak.
- **Polymath** — reach Level 5 in all ten skill trees.
- **Article 22 Whisperer** — resolve an automated decision-making dispute.
- **Court Veteran** — handle 10 court order / law enforcement disclosures.
- **Exam Ready** — complete the full BCS Practitioner mock track.

### Daily mechanics

- **Daily Inbox** — 3–5 new scenarios per day (refreshes 6am).
- **Streak Counter** — consecutive days with at least one scenario
  completed.
- **Weekly Challenge** — themed week (e.g. "Breach Week", "Transfer Week")
  with bonus XP.
- **Boss Scenario** — one complex multi-stage scenario per week (e.g.
  multi-client data breach with regulatory ramifications).

### Leaderboard (optional, later)

Global and weekly leaderboards — XP earned, scenarios completed, skill
mastery.

## 5. Scenario types (the content library)

Each scenario is a structured object in a YAML/JSON file so scenarios can be
added without coding. Example shape:

```yaml
id: scenario_042
tier: 2
client: silverbrook_care
skill: sar_handling
difficulty: complex
title: "SAR from former resident's daughter"
time_limit_minutes: 30
xp_base: 100
briefing:
  request_type: "Subject Access Request"
  what_user_needs_to_know: |
    A SAR from a third party acting on behalf of a data subject.
    Key legal points: verification of identity, proof of authority to act,
    Schedule 3 exemptions for social work records, redaction of third-party
    data.
  common_pitfalls: |
    - Releasing records without verifying authority
    - Missing the "serious harm" test
    - Over-applying or under-applying Schedule 3 para 3
email_body: |
  [Full simulated email from client]
supporting_documents:
  - sample_care_record.pdf
  - complaint_letter.pdf
user_task: "Draft your response to the client advising on how to handle this SAR"
rubric:
  - identifies_need_for_authority_verification: 20
  - correctly_cites_schedule_3: 20
  - addresses_third_party_redaction: 15
  - advises_on_statutory_deadline: 15
  - recommends_appropriate_exemptions: 15
  - clear_communication: 15
exemplar_response: |
  [A senior DPO's model answer for the coach to compare against]
```

### Request types to cover across the library

| # | Request Type | Skill |
| - | ------------ | ----- |
| 1 | Standard SAR | SAR Handling |
| 2 | Complex SAR (third-party, safeguarding) | SAR Handling |
| 3 | SAR refusal (manifestly unfounded) | SAR Handling |
| 4 | FOI request + exemption application | FOI Decisions |
| 5 | FOI internal review | FOI Decisions |
| 6 | New processing activity — DPIA needed | DPIA Authoring |
| 7 | AI system — EU AI Act + DPIA | DPIA + AI Gov |
| 8 | Personal data breach notification (72hr) | Breach Response |
| 9 | Breach NOT requiring notification (decision write-up) | Breach Response |
| 10 | US vendor using personal data — transfer mechanism | Intl Transfers |
| 11 | Post-adequacy transfer issue | Intl Transfers |
| 12 | Processor agreement review (DPA clauses) | Contract & Vendor |
| 13 | Joint controller arrangement | Contract & Vendor |
| 14 | Cookie banner review | PECR & Marketing |
| 15 | Marketing consent dispute | PECR & Marketing |
| 16 | School consent query | Children's Data |
| 17 | Age assurance for EdTech | Children's Data |
| 18 | Article 22 automated decision complaint | AI Governance |
| 19 | ICO complaint response | Regulator Liaison |
| 20 | Police request for data (Schedule 2 Part 1) | Regulator Liaison |
| 21 | Court order for disclosure | Regulator Liaison |
| 22 | Data subject complaint escalation | SAR Handling |
| 23 | RoPA update for new processing | Governance |
| 24 | Data retention review | Governance |
| 25 | Subject rectification request | SAR Handling |

Target: 40–50 scenarios at launch, expanding indefinitely.

## 6. Technical architecture

### Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS +
  shadcn/ui.
- **Backend:** Next.js API routes (or tRPC later for type safety).
- **Database:** SQLite locally, Postgres via Supabase when deployed.
- **ORM:** Prisma.
- **Auth:** NextAuth (email magic link to start, Google later).
- **AI coaching:** Anthropic API (Claude Sonnet for reviews, Haiku for
  hints).
- **Scenario storage:** YAML files in `/content/scenarios/` committed to
  repo.
- **Deployment:** Vercel (free tier) + Supabase (free tier).

### File structure

```
aegis/
├── app/
│   ├── dashboard/
│   ├── inbox/
│   ├── scenario/[id]/
│   ├── learn/
│   │   └── [topic]/
│   ├── profile/
│   └── api/
│       ├── coach/
│       └── scenarios/
├── components/
│   ├── Inbox/
│   ├── Coach/
│   ├── Progress/
│   └── ui/                (shadcn)
├── content/
│   ├── scenarios/         (YAML files, one per scenario)
│   ├── clients/           (YAML files describing each fictional company)
│   └── guides/            (MDX files for learning resources)
├── lib/
│   ├── db.ts
│   ├── xp.ts              (level calculation, XP rules)
│   ├── anthropic.ts       (AI coaching calls)
│   └── scenarios.ts       (load and manage scenario content)
├── prisma/
│   └── schema.prisma
└── public/
```

### Database schema (Prisma)

> **Sprint 1 note:** `badges` stored as Prisma `Json` (shape: `string[]`)
> because SQLite can't hold arrays natively. Every other field matches the
> brief exactly.

```prisma
model User {
  id              String    @id
  email           String    @unique
  name            String?
  level           Int       @default(1)
  totalXp         Int       @default(0)
  currentStreak   Int       @default(0)
  longestStreak   Int       @default(0)
  lastActiveDate  DateTime?
  skillProgress   Json      // { sar: {level: 3, xp: 240}, foi: {...} }
  badges          Json      // string[]
  completions     ScenarioCompletion[]
  responses       Response[]
}

model Scenario {
  id              String    @id
  title           String
  tier            Int
  clientId        String
  skill           String
  difficulty      String
  contentPath     String    // path to YAML
  completions     ScenarioCompletion[]
}

model ScenarioCompletion {
  id              String    @id @default(cuid())
  userId          String
  scenarioId      String
  score           Int
  xpEarned        Int
  timeSpentSec    Int
  completedAt     DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id])
  scenario        Scenario  @relation(fields: [scenarioId], references: [id])
}

model Response {
  id              String    @id @default(cuid())
  userId          String
  scenarioId      String
  userAnswer      String    @db.Text
  coachFeedback   String    @db.Text
  rubricScores    Json
  createdAt       DateTime  @default(now())
  user            User      @relation(fields: [userId], references: [id])
}
```

### The AI coach (critical feature)

Three API endpoints:

1. **`/api/coach/brief`** — pre-task briefing. Claude acts as a senior DPO
   mentor, frames the scenario, explains applicable law, ends with
   "What's your approach?". Does **not** give the answer.
2. **`/api/coach/hint`** — mid-task Socratic hint (max 2 sentences) when the
   user clicks "I'm stuck".
3. **`/api/coach/review`** — post-submission review. Scores against rubric,
   returns structured JSON (scores, strengths, gaps, narrative review) plus
   updates XP and skill levels.

**Cost management:** cache briefings (static per scenario), Haiku 4.5 for
hints (cheap), Sonnet 4.6 for reviews (quality).

## 7. Learning resources

MDX files in `/content/guides/` rendered as rich pages. Each guide has core
content, linked practice scenarios, and a 5-question mini-quiz for bonus XP.

Planned guides: DPIA, SAR Lifecycle, Schedule 2 & 3 Exemptions, FOI
Decision-Making, Breach Response Playbook, International Transfers, Court
Orders & Police Requests, PECR Essentials, Children's Data in 2026, AI
Governance for DPOs, BCS Practitioner prep, CIPP/E prep.

## 8. UI / visual style

Dashboard-first layout. On login the user sees:

- Level / Title banner across the top.
- Streak counter.
- Skill radar chart (10 skills).
- Today's Inbox (4 scenarios waiting).
- Continue Learning card.
- Recent achievements.
- Weekly challenge banner.

Inbox = three-pane Outlook-style layout, but modern (Superhuman-feel).
Scenario page = email reading pane left, response editor right, coach panel
bottom (expand / collapse).

A detailed style guide will be produced by the design track separately
(deferred to Sprint 3 for implementation).

## 9. Build sequence (sprint-based)

- **Sprint 1 — Foundation.** Scaffold Next.js + TS + Tailwind + shadcn;
  Prisma + SQLite; basic auth; dashboard with mock data; placeholder
  routes.
- **Sprint 2 — Scenario engine.** YAML loader, scenario page, response
  editor, Anthropic brief + review, XP + level system, completion flow.
- **Sprint 3 — Content & gamification.** Seed scenarios, skill trees,
  badges, streak logic, weekly challenge, MDX guides.
- **Sprint 4 — Polish.** Deployment to Vercel, Supabase Postgres, mobile,
  performance.
