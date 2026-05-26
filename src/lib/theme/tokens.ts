/** Retro industrial dashboard — semantic colors */
export const palette = {
  black: "#050505",
  cream: "#F3EBDD",
  surface: "#F7F0E2",
  border: "#D2C29B",
  gold: "#C9A227",
  goldDark: "#B68B16",
  goldBright: "#D6B63A",
  text: "#17150E",
  textMuted: "#5F5432",
  red: "#9D2E22",
  redBright: "#B13A2E",
  green: "#3F6B3F",
  greenBright: "#4F7A45",
  muted: "#8A7A4A",
} as const;

export const chartTheme = {
  line: "#17150E",
  bar: "#C9A227",
  barRisk: "#B13A2E",
  grid: "#D2C29B",
  axis: "#7D6C35",
  threshold: "#B68B16",
  elevatedBand: "#EFE5D2",
  risk: "#9D2E22",
  healthy: "#3F6B3F",
  watch: "#C9A227",
  muted: "#8A7A4A",
  dotNeutral: "#2B271A",
  dotWatch: "#B68B16",
  dotRisk: "#9D2E22",
  tooltipBg: "#F7F0E2",
  tooltipBorder: "#D2C29B",
} as const;

/** VFD / blackout telemetry charts — alias of dashboard plot tokens */
export const vfdChartTheme = {
  grid: "#141414",
  axis: "#666666",
  threshold: "#ffaa00",
  risk: "#ff0000",
  healthy: "#00ff00",
  bar: "#ffaa00",
  barMuted: "#333333",
  barMid: "#666666",
  tooltipBg: "#000000",
  tooltipBorder: "#1a1a1a",
  cursorFill: "rgba(255, 170, 0, 0.06)",
  cursorStroke: "#2a2a2a",
  activeBarFill: "rgba(255, 170, 0, 0.22)",
  activeBarStroke: "#ffaa00",
  pieActiveFill: "rgba(255, 170, 0, 0.18)",
} as const;

export const statusStyles = {
  healthy: "retro-tag retro-tag-green",
  watch: "retro-tag border-[#C9A227] bg-[#F2E7D2] text-[#5A4B10]",
  risk: "retro-tag retro-tag-red",
  neutral: "retro-tag retro-tag-neutral",
  system: "retro-tag retro-tag-neutral",
} as const;

export const eventTypeStyles: Record<string, string> = {
  Prediction: "retro-tag retro-tag-neutral",
  Stream: "retro-tag border-[#C9A227] bg-[#F2E7D2] text-[#5A4B10]",
  System: "retro-tag retro-tag-neutral",
  API: "retro-tag border-[#2B271A] bg-[#EADDC4] text-[#17150E]",
  Dataset: "retro-tag retro-tag-neutral",
  "User Action": "retro-tag retro-tag-neutral",
};

export const severityStyles = {
  Low: {
    pill: "retro-tag retro-tag-green",
    accent: "#3F6B3F",
    bar: "bg-[#4F7A45]",
  },
  Moderate: {
    pill: "retro-tag border-[#C9A227] bg-[#F2E7D2] text-[#5A4B10]",
    accent: "#C9A227",
    bar: "bg-[#D6B63A]",
  },
  High: {
    pill: "retro-tag retro-tag-red",
    accent: "#9D2E22",
    bar: "bg-[#B13A2E]",
  },
  neutral: {
    pill: "retro-tag retro-tag-neutral",
    accent: "#8A7A4A",
    bar: "bg-[#B6A978]",
  },
  "—": {
    pill: "retro-tag retro-tag-neutral",
    accent: "#D2C29B",
    bar: "bg-[#D2C29B]",
  },
} as const;

export function parseDisplayPercent(value: string): number | null {
  if (!value || value === "—" || value.startsWith("<")) return null;
  const n = parseFloat(value.replace("%", "").trim());
  return Number.isFinite(n) ? n : null;
}

export function probabilityTextClass(percent: number | null): string {
  if (percent == null) return "retro-txt-muted";
  if (percent >= 50) return "retro-txt-danger font-semibold";
  if (percent >= 40) return "retro-txt-gold font-semibold";
  return "retro-txt-primary";
}

export function chartPointFill(probabilityDisplay: number, knownFailure?: boolean): string {
  if (knownFailure) return chartTheme.dotRisk;
  if (probabilityDisplay >= 50) return chartTheme.dotRisk;
  if (probabilityDisplay >= 40) return chartTheme.dotWatch;
  return chartTheme.dotNeutral;
}

export function predictionStatusClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("maintenance risk") || s.includes("failure risk")) return statusStyles.risk;
  if (s.includes("watch") || s.includes("elevated")) return statusStyles.watch;
  if (s.includes("healthy")) return statusStyles.healthy;
  return statusStyles.neutral;
}

export function eventTypeBadgeClass(type: string): string {
  return eventTypeStyles[type] ?? statusStyles.neutral;
}

export function groundTruthPillClass(gt: string): string {
  const s = gt.toLowerCase();
  if (s === "failure") return statusStyles.risk;
  if (s === "normal") return statusStyles.healthy;
  return statusStyles.neutral;
}

export function actionTextClass(action: string): string {
  const a = action.toLowerCase();
  if (a.includes("inspect") || a.includes("urgent") || a.includes("shutdown")) {
    return "retro-txt-danger font-medium";
  }
  if (a.includes("drift") || a.includes("review") || a.includes("watch")) {
    return "retro-txt-gold";
  }
  if (a.includes("monitor") || a.includes("continue")) {
    return "retro-txt-success";
  }
  return "retro-txt-secondary";
}

export function healthHeadlineClass(label: string): string {
  const s = label.toLowerCase();
  if (s.includes("failure") || s.includes("maintenance risk") || s.includes("risk")) {
    return "retro-txt-danger";
  }
  if (s.includes("watch") || s.includes("elevated")) {
    return "retro-txt-gold";
  }
  if (s.includes("healthy") || s.includes("normal")) {
    return "retro-txt-success";
  }
  return "retro-txt-primary";
}

export function severityKey(
  level: "Low" | "Moderate" | "High" | "—",
  neutral?: boolean,
): keyof typeof severityStyles {
  if (neutral) return "neutral";
  if (level === "Low" || level === "Moderate" || level === "High") return level;
  return "—";
}

export type BufferCellVariant = "empty" | "filled" | "tail" | "active" | "risk";

export function bufferCellVariant(
  index: number,
  fill: number,
  displayProb: number | null,
): BufferCellVariant {
  if (index >= fill) return "empty";

  const distFromActive = fill - 1 - index;
  const prob = displayProb ?? 0;

  if (distFromActive === 0 && prob >= 50) return "risk";
  if (isRecent(distFromActive) && prob >= 50) return "risk";
  if (distFromActive === 0) return "active";
  if (isRecent(distFromActive) && prob >= 40) return "tail";
  if (isRecent(distFromActive)) return "tail";
  return "filled";
}

function isRecent(distFromActive: number): boolean {
  return distFromActive < 5;
}

export function phaseBadgeClass(
  phase: "idle" | "building" | "ready" | "inference_active",
  fill: number,
): string {
  if (fill >= 50 && (phase === "ready" || phase === "inference_active")) {
    return "retro-tag retro-tag-gold";
  }
  if (phase === "inference_active") {
    return "retro-tag border-[#C9A227] bg-[#F2E7D2] text-[#5A4B10]";
  }
  return "retro-tag retro-tag-neutral";
}
