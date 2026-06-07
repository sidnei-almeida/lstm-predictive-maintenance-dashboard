"use client";

import { ResponsiveContainer } from "recharts";
import type { ReactElement } from "react";

/** Recharts needs a definite pixel height — percentage height often resolves to 0 in flex/grid layouts. */
export function VfdChartFrame({
  height,
  className,
  children,
}: {
  height: number;
  className?: string;
  children: ReactElement;
}) {
  return (
    <div
      className={className ?? "countach-chart-plot relative w-full"}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export const DASHBOARD_TREND_CHART_HEIGHT = 280;
export const ALERTS_TIMELINE_CHART_HEIGHT = 160;
