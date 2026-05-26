"use client";

import { TopKpiCard, TopKpiGrid, type VfdValueKind } from "@/components/layout/top-kpi-card";
import { SEQUENCE_LENGTH, THRESHOLD_DISPLAY } from "@/lib/features/constants";
import {
  formatDisplayPercentLabel,
  healthToAssetLabel,
  streamStatusLabel,
} from "@/lib/maintenance/status";
import type { HealthBand } from "@/lib/types/maintenance";
import { selectSequenceFill, useMaintenanceStore } from "@/store/maintenance-store";

function vfdBracket(text: string): string {
  return `[ ${text} ]`;
}

function streamKpi(streamStatus: "idle" | "live" | "paused"): {
  label: string;
  value: string;
  vfdValueKind: VfdValueKind;
} {
  const label = streamStatusLabel(streamStatus).toUpperCase();
  if (streamStatus === "live") {
    return { label: "STREAM STATUS", value: vfdBracket(label), vfdValueKind: "status-positive" };
  }
  return { label: "STREAM STATUS", value: vfdBracket(label), vfdValueKind: "status-negative" };
}

function healthKpi(inference: { health: HealthBand } | null): {
  label: string;
  value: string;
  vfdValueKind: VfdValueKind;
} {
  if (!inference) {
    return { label: "ASSET HEALTH", value: "—", vfdValueKind: "dim" };
  }

  const assetLabel = healthToAssetLabel(inference.health).toUpperCase();

  if (inference.health === "healthy") {
    return {
      label: "ASSET HEALTH",
      value: vfdBracket(assetLabel),
      vfdValueKind: "status-positive",
    };
  }

  if (inference.health === "awaiting" || assetLabel === "—") {
    return { label: "ASSET HEALTH", value: "—", vfdValueKind: "dim" };
  }

  if (inference.health === "watch") {
    return { label: "ASSET HEALTH", value: assetLabel, vfdValueKind: "numeric" };
  }

  return {
    label: "ASSET HEALTH",
    value: vfdBracket(assetLabel),
    vfdValueKind: "status-negative",
  };
}

export function KpiRow() {
  const streamStatus = useMaintenanceStore((s) => s.streamStatus);
  const inference = useMaintenanceStore((s) => s.inference);
  const packetsProcessed = useMaintenanceStore((s) => s.packetsProcessed);
  const fill = useMaintenanceStore(selectSequenceFill);

  const stream = streamKpi(streamStatus);
  const health = healthKpi(inference);

  const failureValue = inference
    ? formatDisplayPercentLabel(inference.displayProbability, inference.rawProbability)
    : "—";

  const kpis: { label: string; value: string; vfdValueKind: VfdValueKind }[] = [
    stream,
    {
      label: "FAILURE PROB.",
      value: failureValue,
      vfdValueKind: inference ? "numeric" : "dim",
    },
    health,
    {
      label: "SEQ. WINDOW",
      value: `${fill} / ${SEQUENCE_LENGTH}`,
      vfdValueKind: "numeric",
    },
    {
      label: "THRESHOLD",
      value: `${THRESHOLD_DISPLAY}%`,
      vfdValueKind: "numeric",
    },
    {
      label: "PACKETS",
      value: String(packetsProcessed),
      vfdValueKind: "numeric",
    },
  ];

  return (
    <TopKpiGrid className="vfd-kpi-grid sm:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => (
        <TopKpiCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.value}
          vfdValueKind={kpi.vfdValueKind}
        />
      ))}
    </TopKpiGrid>
  );
}
