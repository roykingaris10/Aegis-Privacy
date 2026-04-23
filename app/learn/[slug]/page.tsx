import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";

import { requireGuideBySlug, getAllGuides } from "@/lib/guides";
import { getScenarioById } from "@/lib/scenarios";
import { SKILLS } from "@/lib/skills";
import { getCurrentUserOrNull } from "@/lib/current-user";
import { prisma } from "@/lib/db";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MdxRenderer } from "@/components/mdx/mdx-renderer";
import { GuideToc } from "@/components/learn/guide-toc";
import { ReadingProgress } from "@/components/learn/reading-progress";
import { MarkCompleteButton } from "@/components/learn/mark-complete-button";

export async function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const guide = requireGuideBySlug(slug);
  if (!guide) notFound();

  const user = await getCurrentUserOrNull();
  let completed = false;
  if (user) {
    const progress = await prisma.guideProgress.findUnique({
      where: { userId_guideSlug: { userId: user.id, guideSlug: slug } },
    });
    completed = !!progress;
  }

  const skillLabel =
    SKILLS.find((s) => s.key === guide.skill)?.label ?? guide.skill;

  // Related scenarios.
  const relatedScenarios = guide.relatedScenarios
    .map((id) => {
      const s = getScenarioById(id);
      return s ? { id: s.id, title: s.title, tier: s.tier, skill: s.skill } : null;
    })
    .filter(Boolean) as { id: string; title: string; tier: number; skill: string }[];

  return (
    <>
      <ReadingProgress />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex gap-10">
          {/* Sticky TOC sidebar */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-20">
              <GuideToc source={guide.source} />
            </div>
          </aside>

          {/* Main article */}
          <article className="min-w-0 max-w-3xl flex-1">
            {/* Back link */}
            <Link
              href="/learn"
              className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="h-3 w-3" />
              All guides
            </Link>

            {/* Header */}
            <div className="mb-8">
              <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                {skillLabel}
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">
                {guide.title}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {guide.description}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {guide.readingTimeMinutes} min read
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  {guide.quizXp} XP from quiz
                </span>
              </div>
            </div>

            {/* MDX content */}
            <MdxRenderer source={guide.source} />

            {/* Mark complete */}
            <div className="mt-10 flex items-center gap-4 border-t border-slate-800 pt-6">
              <MarkCompleteButton
                guideSlug={guide.slug}
                initialCompleted={completed}
              />
            </div>

            {/* Related scenarios */}
            {relatedScenarios.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-semibold">
                  Practice what you&apos;ve learned
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {relatedScenarios.map((s) => (
                    <Link key={s.id} href={`/scenario/${s.id}`}>
                      <Card className="transition-colors hover:border-slate-500">
                        <CardHeader className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                              T{s.tier}
                            </span>
                            <CardTitle className="text-sm leading-snug">
                              {s.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </div>
    </>
  );
}
