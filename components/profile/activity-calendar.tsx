"use client";

import * as React from "react";
import { ActivityCalendar, type Activity } from "react-activity-calendar";
import { useTheme } from "next-themes";

type Props = {
  data: Activity[];
};

export function ProfileActivityCalendar({ data }: Props): React.ReactElement {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <ActivityCalendar
      data={data}
      blockSize={11}
      blockMargin={3}
      fontSize={11}
      colorScheme={dark ? "dark" : "light"}
      theme={{
        light: ["#eceff4", "#cfe5d6", "#9bccab", "#6bb286", "#3f8a5b"],
        dark: ["#1a202a", "#22352a", "#2d5339", "#3b7b52", "#52a96f"],
      }}
    />
  );
}
