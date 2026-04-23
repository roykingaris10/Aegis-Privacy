// Guide content loader. Reads MDX files from /content/guides/, parses
// frontmatter, and caches in module scope. Server-only (uses node:fs).

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import type { SkillKey } from "@/lib/skills";

const GUIDES_DIR = path.join(process.cwd(), "content", "guides");

export type StudyTrack = "bcs" | "cippe" | "cippuk";

export type GuideMeta = {
  slug: string;
  title: string;
  description: string;
  skill: SkillKey;
  readingTimeMinutes: number;
  /** XP available from the quiz at the end. */
  quizXp: number;
  relatedScenarios: string[];
  studyTracks: StudyTrack[];
  order: number;
};

export type Guide = GuideMeta & {
  /** Raw MDX source (without frontmatter). */
  source: string;
};

let cache: ReadonlyArray<GuideMeta> | null = null;
let cacheBySlug: ReadonlyMap<string, Guide> | null = null;

function loadAll(): { metas: ReadonlyArray<GuideMeta>; bySlug: ReadonlyMap<string, Guide> } {
  if (cache && cacheBySlug) return { metas: cache, bySlug: cacheBySlug };

  if (!fs.existsSync(GUIDES_DIR)) {
    cache = [];
    cacheBySlug = new Map();
    return { metas: cache, bySlug: cacheBySlug };
  }

  const files = fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".mdx"));

  const guides: Guide[] = files.map((file) => {
    const filePath = path.join(GUIDES_DIR, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);

    const slug = file.replace(/\.mdx$/, "");
    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      skill: data.skill as SkillKey,
      readingTimeMinutes: data.readingTimeMinutes ?? Math.ceil(content.split(/\s+/).length / 200),
      quizXp: data.quizXp ?? 50,
      relatedScenarios: data.relatedScenarios ?? [],
      studyTracks: data.studyTracks ?? [],
      order: data.order ?? 99,
      source: content,
    };
  });

  guides.sort((a, b) => a.order - b.order);
  cache = Object.freeze(
    guides.map((g) => {
      const meta: GuideMeta = {
        slug: g.slug,
        title: g.title,
        description: g.description,
        skill: g.skill,
        readingTimeMinutes: g.readingTimeMinutes,
        quizXp: g.quizXp,
        relatedScenarios: g.relatedScenarios,
        studyTracks: g.studyTracks,
        order: g.order,
      };
      return meta;
    }),
  );
  cacheBySlug = new Map(guides.map((g) => [g.slug, g]));
  return { metas: cache, bySlug: cacheBySlug };
}

export function getAllGuides(): ReadonlyArray<GuideMeta> {
  return loadAll().metas;
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return loadAll().bySlug.get(slug);
}

export function requireGuideBySlug(slug: string): Guide {
  const g = getGuideBySlug(slug);
  if (!g) throw new Error(`Unknown guide: ${slug}`);
  return g;
}

export function getGuidesBySkill(skill: SkillKey): ReadonlyArray<GuideMeta> {
  return getAllGuides().filter((g) => g.skill === skill);
}

export function getGuidesByTrack(track: StudyTrack): ReadonlyArray<GuideMeta> {
  return getAllGuides().filter((g) => g.studyTracks.includes(track));
}
