import type { HealthBand, PredictionLabel, RiskBand } from "@/lib/types/maintenance";

import { THRESHOLD_RAW, WATCH_THRESHOLD } from "../features/constants";

/**
 * Convert raw probability (0–1) to display percent.
 * Preserves small non-zero values so the chart does not collapse to 0%.
 */
export function toDisplayPercent(probability: number): number {
  if (!Number.isFinite(probability)) return 0;
  if (probability <= 0) return 0;
  if (probability >= 1) return 100;

  const percent = probability * 100;

  // Tiny but non-zero: keep 3 decimal places (e.g. 0.007%)
  if (percent > 0 && percent < 0.1) {
    return Math.round(percent * 1000) / 1000;
  }

  // Standard: one decimal (e.g. 68.3%)
  return Math.round(percent * 10) / 10;
}

export function deriveHealth(probability: number | null): HealthBand {
  if (probability === null || !Number.isFinite(probability)) return "awaiting";
  if (probability < WATCH_THRESHOLD) return "healthy";
  if (probability < THRESHOLD_RAW) return "watch";
  return "maintenance_risk";
}

/** Status from raw probability only (not API predicted_label or dataset label). */
export function derivePrediction(probability: number | null): PredictionLabel {
  if (probability === null || !Number.isFinite(probability)) return "—";
  const display = toDisplayPercent(probability);
  if (display >= THRESHOLD_RAW * 100) return "Maintenance Risk";
  if (display >= WATCH_THRESHOLD * 100) return "Watch";
  return "Healthy";
}

export function deriveRiskBand(probability: number | null): RiskBand {
  if (probability === null || !Number.isFinite(probability)) return "—";
  if (probability < WATCH_THRESHOLD) return "low";
  if (probability < THRESHOLD_RAW) return "medium";
  return "high";
}

export function healthToAssetLabel(health: HealthBand): string {
  switch (health) {
    case "healthy":
      return "Healthy";
    case "watch":
      return "Watch";
    case "maintenance_risk":
      return "Maintenance Risk";
    case "awaiting":
    default:
      return "—";
  }
}

export function streamStatusLabel(status: "idle" | "live" | "paused"): string {
  if (status === "live") return "Live";
  if (status === "paused") return "Paused";
  return "Idle";
}

export function recommendedAction(prediction: PredictionLabel): string {
  if (prediction === "Healthy") return "Continue monitoring";
  if (prediction === "Watch") return "Schedule inspection and monitor tool wear trend";
  if (prediction === "Maintenance Risk")
    return "Prioritize maintenance review and inspect equipment before continued operation";
  return "Start stream to enable recommendations";
}

export function priorityLevel(prediction: PredictionLabel): "Low" | "Medium" | "High" | "—" {
  if (prediction === "Healthy") return "Low";
  if (prediction === "Watch") return "Medium";
  if (prediction === "Maintenance Risk") return "High";
  return "—";
}

export function nextStep(prediction: PredictionLabel): string {
  if (prediction === "Healthy") return "Continue monitoring";
  if (prediction === "Watch") return "Review tool wear trend";
  if (prediction === "Maintenance Risk") return "Inspect asset before continued operation";
  return "Start stream";
}

export function groundTruthLabel(machineFailure: 0 | 1 | undefined): "Normal" | "Failure" | "Unknown" {
  if (machineFailure === 0) return "Normal";
  if (machineFailure === 1) return "Failure";
  return "Unknown";
}

/** Human-readable percent label; tiny non-zero values show as "<0.1%". */
export function formatDisplayPercentLabel(
  displayProbability: number,
  rawProbability?: number,
): string {
  const raw = rawProbability ?? displayProbability / 100;
  if (!Number.isFinite(displayProbability) || (displayProbability <= 0 && raw <= 0)) {
    return "0%";
  }
  if (displayProbability > 0 && displayProbability < 0.1) {
    return "<0.1%";
  }
  return `${displayProbability}%`;
}

/** Maintenance state derived from model probability thresholds — not raw probability. */
export function maintenanceStateLabel(probability: number | null): PredictionLabel {
  return derivePrediction(probability);
}
