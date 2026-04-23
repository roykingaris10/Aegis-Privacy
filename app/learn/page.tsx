import * as React from "react";
import Link from "next/link";
import { BookOpen, Clock, Sparkles } from "lucide-react";

import { getAllGuides, getGuidesByTrack, type StudyTrack } from "@/lib/guides";
import { SKILLS } from "@/lib/skills";
import { getCurrentUserOrNull } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const TRACKS: { key: StudyTrack; label: string; description: string }[] = [
  {
    key: "bcs",
    label: "BCS Practitioner",
    description: "Core guides for the BCS Certificate in Data Protection",
  },
  {
    key: "cippe",
    label: "CIPP/E",
    description: "European privacy certification preparation",
  },
  {
    key: "cippuk",
    label: "CIPP/UK",
    description: "UK-specific privacy certification preparation",
  },
];

export default async function LearnPage(): Promise<React.ReactElement> {
  const guides = getAllGuides();
  const user = await getCurrentUserOrNull();

  // Fetch user's guide progress if signed in.
  const progressMap = new Map<string, { completedAt: Date; quizScore: number | null }>();
  if (user) {
    const rows = await prisma.guideProgress.findMany({
      where: { userId: user.id },
    });
    for (const row of rows) {
      progressMap.set(row.guideSlug, {
        completedAt: row.completedAt,
        quizScore: row.quizScore,
      });
    }
  }

  const skillLabelMap = new Map(SKILLS.map((s) => [s.key, s.label]));

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Learn</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Deep-dive guides on data protection topics. Each guide ends with a
          quiz for bonus XP.
        </p>
      </div>

      {/* Guide cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => {
          const progress = progressMap.get(guide.slug);
          const skillLabel = skillLabelMap.get(guide.skill) ?? guide.skill;

          return (
            <Link key={guide.slug} href={`/learn/${guide.slug}`}>
              <Card className="h-full transition-colors hover:border-slate-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                      {skillLabel}
                    </span>
                    {progress && (
                      <span className="text-xs text-emerald-400 font-medium">
                        ✓ Read
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-base leading-snug mt-2">
                    {guide.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {guide.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {guide.readingTimeMinutes} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {guide.quizXp} XP
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Study tracks */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Study Tracks</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TRACKS.map((track) => {
            const trackGuides = getGuidesByTrack(track.key);
            const completedCount = trackGuides.filter((g) =>
              progressMap.has(g.slug),
            ).length;

            return (
              <Card key={track.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-400" />
                    <CardTitle className="text-sm">{track.label}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {track.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    {completedCount} / {trackGuides.length} guides completed
                  </p>
                  <div className="mt-2 space-y-1">
                    {trackGuides.map((g) => (
                      <Link
                        key={g.slug}
                        href={`/learn/${g.slug}`}
                        className="block truncate text-xs text-slate-400 hover:text-slate-200"
                      >
                        {progressMap.has(g.slug) ? "✓ " : "○ "}
                        {g.title}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
