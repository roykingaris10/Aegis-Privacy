// Client content loader. Reads every YAML in /content/clients, validates
// with Zod at module-load time, and caches in module scope. Server-only
// by convention (uses node:fs) — importing from a client component will
// fail at build time.

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

const CONTENT_DIR = path.join(process.cwd(), "content", "clients");

const HEX = /^#[0-9a-fA-F]{6}$/;

export const ClientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  sector: z.string().min(1),
  description: z.string().min(1),
  logoInitials: z.string().min(1).max(3),
  brandColour: z.string().regex(HEX, "brandColour must be a 6-digit hex"),
  regulatoryContext: z.array(z.string().min(1)).min(1),
});

export type Client = z.infer<typeof ClientSchema>;

let cache: ReadonlyArray<Client> | null = null;
let cacheById: ReadonlyMap<string, Client> | null = null;

function loadAll(): ReadonlyArray<Client> {
  if (cache) return cache;

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));

  const clients: Client[] = files.map((file) => {
    const filePath = path.join(CONTENT_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");
    let parsed: unknown;
    try {
      parsed = yaml.load(raw);
    } catch (err) {
      throw new Error(`Malformed YAML in ${file}: ${(err as Error).message}`);
    }
    const result = ClientSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid client in ${file}:\n${JSON.stringify(result.error.format(), null, 2)}`,
      );
    }
    return result.data;
  });

  const ids = clients.map((c) => c.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) {
    throw new Error(
      `Duplicate client ids: ${Array.from(new Set(dupes)).join(", ")}`,
    );
  }

  cache = Object.freeze(clients.sort((a, b) => a.tier - b.tier));
  cacheById = new Map(clients.map((c) => [c.id, c]));
  return cache;
}

export function getAllClients(): ReadonlyArray<Client> {
  return loadAll();
}

export function getClientById(id: string): Client | undefined {
  loadAll();
  return cacheById?.get(id);
}

export function requireClientById(id: string): Client {
  const c = getClientById(id);
  if (!c) throw new Error(`Unknown client: ${id}`);
  return c;
}
