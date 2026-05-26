"use client";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import { computeRiskDrivers } from "@/lib/maintenance/heuristics";
import { cn } from "@/lib/utils";
import type { RiskDriverRow } from "@/lib/types/maintenance";
import { useMaintenanceStore } from "@/store/maintenance-store";

const SEGMENT_COUNT = 18;

type LevelKey = "high" | "moderate" | "low" | "neutral" | "idle";

const LEVEL_MAP: Record<RiskDriverRow["level"], LevelKey> = {
  High: "high",
  Moderate: "moderate",
  Low: "low",
  "—": "idle",
};

/** 5×5 dot-matrix glyphs — W = row label; L/M/H = product line indicators */
const PRODUCT_GLYPH_5: Record<string, boolean[]> = {
  W: [
    true, false, false, false, true,
    true, false, false, false, true,
    true, false, true, false, true,
    true, true, false, true, true,
    true, false, false, false, true,
  ],
  L: [
    true, false, false, false, false,
    true, false, false, false, false,
    true, false, false, false, false,
    true, false, false, false, false,
    true, true, true, true, false,
  ],
  M: [
    true, false, true, false, true,
    true, true, true, true, true,
    true, false, true, false, true,
    true, false, true, false, true,
    true, false, true, false, true,
  ],
  H: [
    true, false, false, false, true,
    true, false, false, false, true,
    true, true, true, true, true,
    true, false, false, false, true,
    true, false, false, false, true,
  ],
};

function litSegments(score: number | undefined, level: RiskDriverRow["level"]): number {
  if (level === "—" || score == null) return 0;
  const clamped = Math.max(0, Math.min(1, score));
  return Math.round(clamped * SEGMENT_COUNT);
}

function segmentClasses(level: LevelKey, on: boolean): string | null {
  if (!on) {
    if (level === "high") return "supercar-risk-seg--high-dim";
    if (level === "moderate") return "supercar-risk-seg--moderate-dim";
    if (level === "low" || level === "neutral") return "supercar-risk-seg--low-dim";
    return null;
  }
  if (level === "high") return "supercar-risk-seg--high";
  if (level === "moderate") return "supercar-risk-seg--moderate";
  if (level === "low" || level === "neutral") return "supercar-risk-seg--low";
  return null;
}

function SegmentedBar({ level, lit }: { level: LevelKey; lit: number }) {
  return (
    <div className="supercar-risk-viz">
      <div className="supercar-risk-segments" role="presentation" aria-hidden>
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
          <div key={i} className={cn("supercar-risk-seg", segmentClasses(level, i < lit))} />
        ))}
      </div>
    </div>
  );
}

function DotBlock({
  pattern,
  active,
  showGlyph,
}: {
  pattern: boolean[];
  active: boolean;
  showGlyph?: boolean;
}) {
  return (
    <div className={cn("supercar-risk-dot-block", active && "supercar-risk-dot-block--active")}>
      {pattern.map((on, i) => (
        <div
          key={i}
          className={cn(
            "supercar-risk-dot",
            on && active && "supercar-risk-dot--on",
            on && !active && showGlyph && "supercar-risk-dot--dim",
          )}
        />
      ))}
    </div>
  );
}

function ProductDotMatrix({ line }: { line: string }) {
  const activeLine = line.replace(/^Line\s*/i, "").trim().toUpperCase();

  return (
    <div className="supercar-risk-viz">
      <div
        className="supercar-risk-dot-matrix"
        role="img"
        aria-label={`Product line ${activeLine || "unknown"}`}
      >
        <DotBlock pattern={PRODUCT_GLYPH_5.W} active={false} showGlyph />
        {(["L", "M", "H"] as const).map((key) => (
          <DotBlock
            key={key}
            pattern={PRODUCT_GLYPH_5[key]}
            active={key === activeLine}
            showGlyph
          />
        ))}
      </div>
    </div>
  );
}

function RiskDriverRowItem({ driver }: { driver: RiskDriverRow }) {
  const isProduct = driver.label === "Product Type";
  const level = isProduct ? "neutral" : LEVEL_MAP[driver.level];
  const lit = litSegments(driver.score, driver.level);
  const levelLabel = driver.level === "—" ? "—" : driver.level.toUpperCase();

  return (
    <li className="supercar-risk-row">
      <span
        className={cn(
          "supercar-risk-accent",
          level === "high" && "supercar-risk-accent--high",
          level === "moderate" && "supercar-risk-accent--moderate",
          level === "low" && "supercar-risk-accent--low",
          level === "neutral" && "supercar-risk-accent--low",
          level === "idle" && "supercar-risk-accent--idle",
        )}
        aria-hidden
      />

      <div className="supercar-risk-main">
        <p className="supercar-risk-label">{driver.label}</p>
        <p className="supercar-risk-value">{driver.detail}</p>
      </div>

      <div className="supercar-risk-badge-wrap">
        <span
          className={cn(
            "supercar-risk-badge",
            level === "high" && "supercar-risk-badge--high",
            level === "moderate" && "supercar-risk-badge--moderate",
            (level === "low" || level === "neutral") && "supercar-risk-badge--low",
            level === "idle" && "supercar-risk-badge--idle",
          )}
        >
          {levelLabel}
        </span>
      </div>

      {isProduct ? (
        <ProductDotMatrix line={driver.detail} />
      ) : (
        <SegmentedBar level={level === "neutral" ? "low" : level} lit={lit} />
      )}
    </li>
  );
}

export function RiskDrivers() {
  const packet = useMaintenanceStore((s) => s.latestPacket);
  const drivers = computeRiskDrivers(packet);

  return (
    <DashboardPanel
      title="Risk Drivers"
      description="Operational signals"
      className="supercar-risk-panel h-full min-h-[260px]"
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
    >
      <ul className="supercar-risk-list">
        {drivers.map((driver) => (
          <RiskDriverRowItem key={driver.label} driver={driver} />
        ))}
      </ul>
    </DashboardPanel>
  );
}
