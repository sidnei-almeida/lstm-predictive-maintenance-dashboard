"use client";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import { SEQUENCE_LENGTH, THRESHOLD_DISPLAY } from "@/lib/features/constants";
import {
  formatDisplayPercentLabel,
  nextStep,
  priorityLevel,
  recommendedAction,
} from "@/lib/maintenance/status";
import type { PredictionLabel } from "@/lib/types/maintenance";
import { probabilityTextClass } from "@/lib/theme/tokens";
import { cn } from "@/lib/utils";
import { selectSequenceFill, useMaintenanceStore } from "@/store/maintenance-store";

const PREDICTION_CHIPS: PredictionLabel[] = ["Healthy", "Watch", "Maintenance Risk"];

function chipClass(chip: PredictionLabel, active: boolean): string {
  if (!active) {
    if (chip === "Healthy") return "retro-chip text-[#4F7A45]";
    if (chip === "Watch") return "retro-chip retro-txt-gold";
    return "retro-chip retro-txt-danger";
  }
  if (chip === "Healthy") return "retro-chip retro-chip--active border-[#3F6B3F] text-[#D4E8D0]";
  if (chip === "Watch") return "retro-chip retro-chip--active";
  return "retro-chip retro-chip--active border-[#9D2E22] text-[#F0DDD9]";
}

function priorityTagClass(prediction: PredictionLabel): string {
  const p = priorityLevel(prediction).toLowerCase();
  if (p === "high") return "retro-tag retro-tag-red";
  if (p === "medium") return "retro-tag border-[#C9A227] bg-transparent text-[#5A4B10]";
  return "retro-tag retro-tag-green";
}

export function MaintenanceDecision() {
  const inference = useMaintenanceStore((s) => s.inference);
  const fill = useMaintenanceStore(selectSequenceFill);
  const apiUsesSimulated = useMaintenanceStore((s) => s.apiUsesSimulated);

  const activePrediction = inference?.status ?? null;
  const engine =
    apiUsesSimulated === null
      ? "Awaiting inference"
      : apiUsesSimulated
        ? "Simulated API"
        : "TensorFlow LSTM";

  const displayProb = inference?.displayProbability ?? null;

  return (
    <DashboardPanel
      title="Maintenance Decision"
      description="LSTM decision output"
      className="h-full min-h-[260px]"
      bodyClassName="flex flex-col gap-2"
    >
      <div>
        <p className="retro-label mb-1.5">Current Prediction</p>
        <div className="flex flex-wrap gap-1">
          {PREDICTION_CHIPS.map((chip) => (
            <span key={chip} className={chipClass(chip, activePrediction === chip)}>
              {chip === "Maintenance Risk" ? "Maint. Risk" : chip.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <dl className="countach-divider-y space-y-0 py-0.5">
        {[
          {
            label: "Failure Probability",
            value: inference
              ? formatDisplayPercentLabel(inference.displayProbability, inference.rawProbability)
              : "—",
            className: probabilityTextClass(displayProb),
          },
          {
            label: "Threshold",
            value: inference ? `${inference.thresholdDisplay}%` : `${THRESHOLD_DISPLAY}%`,
            className: "retro-txt-gold font-medium",
          },
          {
            label: "Predicted Label",
            value: inference ? String(inference.predictedLabel) : "—",
            className: "retro-txt-primary",
          },
          {
            label: "Ground Truth",
            value: inference?.groundTruthLabel ?? "—",
            className:
              inference?.groundTruthLabel === "Failure"
                ? "retro-txt-danger font-medium"
                : inference?.groundTruthLabel === "Normal"
                  ? "retro-txt-success font-medium"
                  : "retro-txt-muted",
          },
          {
            label: "Sequence Window",
            value: `${fill} / ${SEQUENCE_LENGTH}`,
            className: fill >= SEQUENCE_LENGTH ? "retro-txt-success font-medium" : "retro-txt-primary",
          },
        ].map((row) => (
          <div
            key={row.label}
            className="countach-row-divider flex justify-between gap-2 py-1 last:border-b-0"
          >
            <dt className="retro-label">{row.label}</dt>
            <dd className={cn("secondary-value text-[10px]", row.className)}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="retro-callout">
        <p className="retro-callout-label">Recommended Action</p>
        <p className="retro-callout-text">
          {inference
            ? recommendedAction(inference.status)
            : "Start stream to enable recommendations"}
        </p>
      </div>

      <div className="countach-tile-grid grid-cols-2">
        <div className="countach-tile retro-field-box">
          <p className="retro-label">Priority</p>
          {inference ? (
            <span className={cn("mt-1 inline-block", priorityTagClass(inference.status))}>
              {priorityLevel(inference.status).toUpperCase()}
            </span>
          ) : (
            <p className="secondary-value mt-1 text-[10px]">—</p>
          )}
        </div>
        <div className="countach-tile retro-field-box">
          <p className="retro-label">Next Step</p>
          <p className="retro-meta mt-1 font-medium retro-txt-secondary">
            {inference ? nextStep(inference.status) : "Start stream"}
          </p>
        </div>
      </div>

      <footer className="retro-meta space-y-0.5 pt-1">
        <p>
          <span className="retro-txt-muted">Engine:</span> {engine}
        </p>
        <p>
          <span className="retro-txt-muted">Latency:</span>{" "}
          {inference?.latencyMs != null ? (
            <span className="retro-txt-primary">{inference.latencyMs} ms</span>
          ) : (
            "—"
          )}
        </p>
      </footer>
    </DashboardPanel>
  );
}
