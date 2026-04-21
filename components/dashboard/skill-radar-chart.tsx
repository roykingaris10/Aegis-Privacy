"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SkillProgress } from "@/lib/skills";

// Recharts needs a measured DOM node; we skip SSR so Next.js doesn't render
// the chart with zero dimensions during static prerender.
const SkillRadarChartClient = dynamic(
  () =>
    import("./skill-radar-chart-client").then((m) => m.SkillRadarChartClient),
  {
    ssr: false,
    loading: () => <RadarSkeleton />,
  },
);

type SkillRadarChartProps = {
  skillProgress: SkillProgress;
};

export function SkillRadarChart(
  props: SkillRadarChartProps,
): React.ReactElement {
  return <SkillRadarChartClient {...props} />;
}

function RadarSkeleton(): React.ReactElement {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium">Skill progress</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div
          className="h-[320px] w-full animate-pulse rounded-md bg-primary/5"
          aria-hidden
        />
      </CardContent>
    </Card>
  );
}
