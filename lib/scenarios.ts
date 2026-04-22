// Scenario content loader. Reads every YAML in /content/scenarios, validates
// with Zod at module-load time, cross-references the client id against
// /content/clients, and caches in module scope. Server-only by convention
// (uses node:fs) — importing from a client component will fail at build time.

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

import { getClientById } from "@/lib/clients";
import type { SkillKey } from "@/lib/skills";

const CONTENT_DIR = path.join(process.cwd(), "content", "scenarios");

export const SKILL_KEYS = [
  "sar_handling",
  "foi_decisions",
  "dpia_authoring",
  "breach_response",
  "international_transfers",
  "contract_vendor",
  "pecr_marketing",
  "childrens_data",
  "ai_governance",
  "regulator_liaison",
] as const satisfies ReadonlyArray<SkillKey>;

export const ScenarioSchema = z.object({
  id: z.string().min(1),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  client: z.string().min(1),
  skill: z.enum(SKILL_KEYS),
  difficulty: z.enum(["straightforward", "complex", "contested"]),
  title: z.string().min(1),
  timeLimitMinutes: z.number().int().positive(),
  xpBase: z.number().int().positive(),
  briefing: z.object({
    requestType: z.string().min(1),
    whatUserNeedsToKnow: z.string().min(1),
    commonPitfalls: z.string().min(1),
  }),
  emailSender: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
    email: z.email(),
  }),
  emailSubject: z.string().min(1),
  emailBody: z.string().min(1),
  supportingDocuments: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.enum(["pdf", "image", "email", "document"]),
        excerpt: z.string().optional(),
      }),
    )
    .default([]),
  userTask: z.string().min(1),
  rubric: z
    .array(
      z.object({
        criterion: z.string().min(1),
        maxPoints: z.number().int().positive(),
        description: z.string().min(1),
      }),
    )
    .min(1),
  exemplarResponse: z.string().min(1),
});

export type Scenario = z.infer<typeof ScenarioSchema>;
export type ScenarioTier = Scenario["tier"];
export type ScenarioDifficulty = Scenario["difficulty"];

let cache: ReadonlyArray<Scenario> | null = null;
let cacheById: ReadonlyMap<string, Scenario> | null = null;

function loadAll(): ReadonlyArray<Scenario> {
  if (cache) return cache;

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

  const scenarios: Scenario[] = files.map((file) => {
    const filePath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");
    let parsed: unknown;
    try {
      parsed = yaml.load(raw);
    } catch (err) {
      throw new Error(`Malformed YAML in ${file}: ${(err as Error).message}`);
    }
    const result = ScenarioSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid scenario in ${file}:\n${JSON.stringify(result.error.format(), null, 2)}`,
      );
    }
    const scenario = result.data;
    if (!getClientById(scenario.client)) {
      throw new Error(
        `Scenario ${scenario.id} references unknown client: ${scenario.client}`,
      );
    }
    const rubricTotal = scenario.rubric.reduce((s, r) => s + r.maxPoints, 0);
    if (rubricTotal !== 100) {
      throw new Error(
        `Scenario ${scenario.id} rubric totals ${rubricTotal}, expected 100`,
      );
    }
    return scenario;
  });

  const ids = scenarios.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) {
    throw new Error(
      `Duplicate scenario ids: ${Array.from(new Set(dupes)).join(", ")}`,
    );
  }

  cache = Object.freeze(
    scenarios.sort((a, b) => a.tier - b.tier || a.id.localeCompare(b.id)),
  );
  cacheById = new Map(scenarios.map((s) => [s.id, s]));
  return cache;
}

export function getAllScenarios(): ReadonlyArray<Scenario> {
  return loadAll();
}

export function getScenarioById(id: string): Scenario | undefined {
  loadAll();
  return cacheById?.get(id);
}

export function requireScenarioById(id: string): Scenario {
  const s = getScenarioById(id);
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}

export function getScenariosByTier(
  tier: ScenarioTier,
): ReadonlyArray<Scenario> {
  return loadAll().filter((s) => s.tier === tier);
}

export function getScenariosBySkill(skill: SkillKey): ReadonlyArray<Scenario> {
  return loadAll().filter((s) => s.skill === skill);
}
