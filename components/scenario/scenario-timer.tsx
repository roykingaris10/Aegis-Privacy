"use client";

import * as React from "react";
import { Clock } from "lucide-react";

type Props = {
  running: boolean;
  onTick?: (elapsedSec: number) => void;
};

export function ScenarioTimer({ running, onTick }: Props): React.ReactElement {
  const [elapsed, setElapsed] = React.useState(0);
  const startedAt = React.useRef<number>(Date.now());

  React.useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const delta = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsed(delta);
      onTick?.(delta);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, onTick]);

  const mm = Math.floor(elapsed / 60)
    .toString()
    .padStart(2, "0");
  const ss = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span className="tabular-nums font-medium">
        {mm}:{ss}
      </span>
    </div>
  );
}
