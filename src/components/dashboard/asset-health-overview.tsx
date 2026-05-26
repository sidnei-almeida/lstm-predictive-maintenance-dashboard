"use client";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import { SEQUENCE_LENGTH, THRESHOLD_DISPLAY } from "@/lib/features/constants";
import { temperatureGap, toolWearState } from "@/lib/maintenance/heuristics";
import { formatDisplayPercentLabel, maintenanceStateLabel } from "@/lib/maintenance/status";
import { predictionStatusClass } from "@/lib/theme/tokens";
import type { InferenceSnapshot, MachinePacket } from "@/lib/types/maintenance";
import { cn } from "@/lib/utils";
import {
  selectSequenceFill,
  selectSequencePhase,
  useMaintenanceStore,
} from "@/store/maintenance-store";

const SEGMENT_COUNT = 20;

const SUBSYSTEMS = [
  { id: "thermal", label: "THERMAL" },
  { id: "kinetic", label: "KINETIC" },
  { id: "tooling", label: "TOOLING" },
  { id: "process", label: "PROCESS" },
] as const;

/** Zonas fixas na barra: verde → âmbar → vermelho (como Risk Drivers) */
const VFD_GREEN_END = 9;
const VFD_AMBER_END = 15;

type VfdZone = "low" | "moderate" | "high";

function litSegmentCount(displayPercent: number | null): number {
  if (displayPercent == null || !Number.isFinite(displayPercent)) return 0;
  const clamped = Math.max(0, Math.min(100, displayPercent));
  return Math.round((clamped / 100) * SEGMENT_COUNT);
}

function vfdZone(index: number): VfdZone {
  if (index < VFD_GREEN_END) return "low";
  if (index < VFD_AMBER_END) return "moderate";
  return "high";
}

function vfdSegmentClass(index: number, lit: number): string {
  const zone = vfdZone(index);
  const on = index < lit;

  if (!on) {
    if (zone === "high") return "supercar-risk-seg--high-dim";
    if (zone === "moderate") return "supercar-risk-seg--moderate-dim";
    return "supercar-risk-seg--low-dim";
  }
  if (zone === "high") return "supercar-risk-seg--high";
  if (zone === "moderate") return "supercar-risk-seg--moderate";
  return "supercar-risk-seg--low";
}

function subsystemLedStates(
  packet: MachinePacket | null,
  inference: InferenceSnapshot | null,
): Record<(typeof SUBSYSTEMS)[number]["id"], boolean> {
  if (!packet || !inference) {
    return { thermal: false, kinetic: false, tooling: false, process: false };
  }

  const gap = temperatureGap(packet);
  const wear = packet.sensors.tool_wear_min;
  const torque = packet.sensors.torque_nm;

  return {
    thermal: gap < 14,
    kinetic: torque < 55,
    tooling: toolWearState(wear) === "Normal",
    process: inference.health === "healthy" || inference.health === "watch",
  };
}

export function AssetHealthOverview() {
  const inference = useMaintenanceStore((s) => s.inference);
  const packet = useMaintenanceStore((s) => s.latestPacket);
  const fill = useMaintenanceStore(selectSequenceFill);
  const phase = useMaintenanceStore(selectSequencePhase);

  const displayProb = inference?.displayProbability ?? null;
  const lit = litSegmentCount(displayProb);

  const probReadout = inference
    ? formatDisplayPercentLabel(inference.displayProbability, inference.rawProbability)
    : "—";

  const maintenanceState = inference ? maintenanceStateLabel(inference.rawProbability) : "—";

  const riskBand =
    inference?.riskBand === "low"
      ? "LOW"
      : inference?.riskBand === "medium"
        ? "MED"
        : inference?.riskBand === "high"
          ? "HIGH"
          : "—";

  const timelineNote =
    fill < SEQUENCE_LENGTH
      ? "Building rolling window — no inference yet"
      : phase === "inference_active"
        ? "LSTM inference active"
        : "Sequence ready — start stream";

  const leds = subsystemLedStates(packet, inference);

  const riskBandClass =
    riskBand === "HIGH"
      ? "asset-health-strip-value--danger"
      : riskBand === "MED"
        ? "asset-health-strip-value--amber"
        : riskBand === "LOW"
          ? "asset-health-strip-value--green"
          : "asset-health-strip-value--dim";

  return (
    <DashboardPanel
      title="Asset Health Overview"
      description="Operational heartbeat"
      className="asset-health-panel h-full min-h-[260px]"
      bodyClassName="asset-health-body flex min-h-0 flex-1 flex-col"
    >
      <section className="asset-health-vfd-section shrink-0">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <p className="retro-label">Model Failure Probability</p>
          <p
            className={cn(
              "font-mono text-[9px] font-bold tracking-[0.14em] uppercase tabular-nums",
              inference ? "text-[#ffaa00]" : "text-[#333333]",
            )}
          >
            {probReadout}
          </p>
        </div>
        <div className="asset-health-vfd-gauge" role="meter" aria-valuenow={displayProb ?? 0} aria-valuemin={0} aria-valuemax={100}>
          <div className="asset-health-vfd-segments">
            {Array.from({ length: SEGMENT_COUNT }).map((_, index) => (
              <div
                key={index}
                className={cn("supercar-risk-seg asset-health-vfd-seg", vfdSegmentClass(index, lit))}
                aria-hidden
              />
            ))}
          </div>
        </div>
        <p className="retro-meta mt-2">
          threshold <span className="text-[#ffaa00]">{THRESHOLD_DISPLAY}%</span>
        </p>
      </section>

      <section className="asset-health-led-section min-h-0 flex-1">
        <p className="retro-label mb-2">Sub-System Diagnostics</p>
        <div className="asset-health-led-matrix grid grid-cols-2 gap-2">
          {SUBSYSTEMS.map((sub) => (
            <div key={sub.id} className="asset-health-led-module flex items-center gap-2">
              <span
                className={cn(
                  "asset-health-led",
                  leds[sub.id] ? "asset-health-led--on" : "asset-health-led--off",
                )}
                aria-hidden
              />
              <span className="asset-health-led-label">{sub.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="asset-health-strip countach-tile flex shrink-0 flex-row items-start justify-between gap-[3px] px-2 py-2">
        <div className="min-w-0">
          <p className="retro-label">Maintenance State</p>
          {maintenanceState === "—" ? (
            <p className="asset-health-strip-value asset-health-strip-value--dim mt-1.5">—</p>
          ) : (
            <span
              className={cn(
                "asset-health-strip-value mt-1.5 inline-block text-[11px] font-bold tracking-wide uppercase",
                predictionStatusClass(maintenanceState),
              )}
            >
              {maintenanceState.toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 text-right">
          <p className="retro-label">Risk Band</p>
          <p className={cn("asset-health-strip-value mt-1.5 text-[11px]", riskBandClass)}>
            {riskBand}
          </p>
        </div>
      </div>

      <div className="asset-health-footer retro-field-box mt-auto shrink-0 border-dashed px-3 py-3">
        <p className="retro-label">Risk Timeline Note</p>
        <p className="retro-meta mt-1.5 leading-relaxed">{timelineNote}</p>
      </div>
    </DashboardPanel>
  );
}
