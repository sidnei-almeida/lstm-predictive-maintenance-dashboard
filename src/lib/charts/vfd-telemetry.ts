/** Shared VFD telemetry plot tokens — matches dashboard Failure Probability Trend */

export const VFD_PLOT = {
  bg: "#000000",
  grid: "#141414",
  line: "#00ff00",
  axis: "#666666",
  threshold: "#ffaa00",
  risk: "#ff0000",
  dot: "#00ff00",
  dotCritical: "#ff0000",
  barMuted: "#333333",
  barMid: "#666666",
  tooltipBg: "#000000",
  tooltipBorder: "#1a1a1a",
  tooltipValue: "#00ff00",
  tooltipLabel: "#666666",
  cursorFill: "rgba(255, 170, 0, 0.06)",
  cursorStroke: "#2a2a2a",
  activeBarFill: "rgba(255, 170, 0, 0.22)",
  activeBarStroke: "#ffaa00",
  pieActiveFill: "rgba(255, 170, 0, 0.18)",
} as const;

export const VFD_MONO =
  'var(--font-geist-mono), "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

export const VFD_AXIS_TICK = {
  fontSize: 9,
  fill: VFD_PLOT.axis,
  fontFamily: VFD_MONO,
  letterSpacing: "0.1em",
} as const;

export const VFD_CHART_MARGIN = {
  top: 10,
  right: 14,
  left: 2,
  bottom: 8,
} as const;

export const VFD_CHART_MARGIN_TALL_X = {
  ...VFD_CHART_MARGIN,
  bottom: 28,
} as const;

export const VFD_GRID = {
  stroke: VFD_PLOT.grid,
  strokeWidth: 1,
  strokeDasharray: "2 4",
  horizontal: true,
  vertical: true,
} as const;

export const VFD_AXIS_FRAME = {
  axisLine: { stroke: VFD_PLOT.grid, strokeWidth: 1 },
  tickLine: { stroke: VFD_PLOT.grid, strokeWidth: 1 },
  stroke: VFD_PLOT.grid,
} as const;

export const VFD_TOOLTIP_CONTENT = {
  fontSize: 9,
  fontFamily: VFD_MONO,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  background: VFD_PLOT.tooltipBg,
  border: `1px solid ${VFD_PLOT.tooltipBorder}`,
  borderRadius: 0,
  padding: "6px 8px",
  color: VFD_PLOT.tooltipValue,
  boxShadow: "none",
};

export const VFD_TOOLTIP_PROPS = {
  contentStyle: VFD_TOOLTIP_CONTENT,
  wrapperStyle: {
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    boxShadow: "none",
  },
  labelStyle: {
    color: VFD_PLOT.tooltipLabel,
    fontFamily: VFD_MONO,
    letterSpacing: "0.1em",
    marginBottom: 4,
  },
  itemStyle: {
    color: VFD_PLOT.tooltipValue,
    fontFamily: VFD_MONO,
  },
  cursor: {
    fill: VFD_PLOT.cursorFill,
    stroke: VFD_PLOT.cursorStroke,
    strokeWidth: 1,
  },
} as const;

export const VFD_ACTIVE_BAR = {
  fill: VFD_PLOT.activeBarFill,
  stroke: VFD_PLOT.activeBarStroke,
  strokeWidth: 1,
};

export const VFD_PIE_ACTIVE = {
  fill: VFD_PLOT.pieActiveFill,
  stroke: VFD_PLOT.threshold,
  strokeWidth: 1,
};

/** Distribution bars — grey scale into phosphor green / amber / red */
export const VFD_BAR_COLORS = [
  VFD_PLOT.barMuted,
  VFD_PLOT.barMid,
  VFD_PLOT.line,
  VFD_PLOT.threshold,
  VFD_PLOT.risk,
] as const;

export const VFD_BAR_RADIUS: [number, number, number, number] = [0, 0, 0, 0];

export const VFD_LEGEND_STYLE = {
  fontSize: 9,
  fontFamily: VFD_MONO,
  color: VFD_PLOT.axis,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
};
