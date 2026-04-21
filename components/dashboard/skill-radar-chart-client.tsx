"use client";

import * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MAX_SKILL_LEVEL, SKILLS, type SkillProgress } from "@/lib/skills";

type SkillRadarChartProps = {
  skillProgress: SkillProgress;
};

export function SkillRadarChartClient({
  skillProgress,
}: SkillRadarChartProps): React.ReactElement {
  const data = SKILLS.map((skill) => ({
    skill: skill.short,
    fullName: skill.label,
    level: skillProgress[skill.key]?.level ?? 0,
  }));

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium">Skill progress</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid
                stroke="hsl(var(--border))"
                gridType="polygon"
                radialLines={false}
              />
              <PolarAngleAxis
                dataKey="skill"
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, MAX_SKILL_LEVEL]}
                tickCount={6}
                tick={{
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                }}
                stroke="hsl(var(--border))"
                axisLine={false}
              />
              <Radar
                name="Level"
                dataKey="level"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.18}
                strokeWidth={1.5}
                dot={{ r: 2, fill: "hsl(var(--primary))" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Each axis levels 0–{MAX_SKILL_LEVEL}
        </p>
      </CardContent>
    </Card>
  );
}
