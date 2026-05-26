import { THRESHOLD_RAW, WATCH_THRESHOLD } from "@/lib/features/constants";

import type { MaintenanceEvent } from "./types";

export type ModelPredictionLabel = "Healthy" | "Failure Risk" | "—";
export type ModelRiskBand = "Low" | "Elevated" | "Failure Risk" | "—";

export function parseEventProbability(event: MaintenanceEvent): number | null {
  if (event.rawProbability != null && Number.isFinite(event.rawProbability)) {
    return event.rawProbability;
  }
  if (event.displayProbability != null && Number.isFinite(event.displayProbability)) {
    return event.displayProbability / 100;
  }
  const m = event.probability.match(/[\d.]+/);
  if (!m) return null;
  const n = Number(m[0]);
  if (!Number.isFinite(n)) return null;
  return event.probability.includes("<") ? 0.0005 : n / (n > 1 ? 100 : 1);
}

export function eventThresholdRaw(event: MaintenanceEvent): number {
  return event.thresholdRaw ?? THRESHOLD_RAW;
}

export function isProcessedPredictionEvent(event: MaintenanceEvent): boolean {
  return (
    event.eventType === "prediction" &&
    event.rawProbability != null &&
    event.event.toLowerCase().includes("prediction processed")
  );
}

/** Model-derived prediction label — not a dataset field */
export function deriveModelPrediction(event: MaintenanceEvent): ModelPredictionLabel {
  const p = parseEventProbability(event);
  const threshold = eventThresholdRaw(event);
  if (p == null && event.predictedLabel == null) return "—";
  if (event.predictedLabel === 1 || (p != null && p >= threshold)) return "Failure Risk";
  if (p != null || event.predictedLabel === 0) return "Healthy";
  return "—";
}

/** Model-derived risk band — clearly not dataset severity */
export function deriveModelRiskBand(event: MaintenanceEvent): ModelRiskBand {
  const p = parseEventProbability(event);
  if (p == null) return "—";
  const threshold = eventThresholdRaw(event);
  if (p >= threshold || event.predictedLabel === 1) return "Failure Risk";
  if (p >= WATCH_THRESHOLD) return "Elevated";
  return "Low";
}

export function isPredictedFailureRisk(event: MaintenanceEvent): boolean {
  return deriveModelPrediction(event) === "Failure Risk";
}

export function isPredictionGroundTruthMismatch(event: MaintenanceEvent): boolean {
  if (!isProcessedPredictionEvent(event)) return false;
  const pred = deriveModelPrediction(event);
  if (pred === "—") return false;
  if (event.groundTruth === "Unknown") return false;
  const gtRisk = event.groundTruth === "Failure";
  const predRisk = pred === "Failure Risk";
  return predRisk !== gtRisk;
}

export function displayEventType(event: MaintenanceEvent): string {
  if (event.eventType === "alert") return "System";
  if (event.source === "System" && event.eventType === "stream") return "System";
  if (event.eventType === "stream") return "Stream";
  if (event.eventType === "prediction") return "Prediction";
  if (event.eventType === "dataset") return "Dataset";
  if (event.eventType === "api") return "API";
  if (event.eventType === "user") return "User Action";
  return "System";
}

export function eventMatchesPredictionFilter(
  event: MaintenanceEvent,
  filter: string,
): boolean {
  if (filter === "all") return true;
  const band = deriveModelRiskBand(event);
  if (filter === "healthy") return deriveModelPrediction(event) === "Healthy";
  if (filter === "elevated") return band === "Elevated";
  if (filter === "failure_risk") return deriveModelPrediction(event) === "Failure Risk";
  return true;
}

export function eventMatchesFailureModeFilter(event: MaintenanceEvent, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "none") return event.failureModes === "—";
  return event.failureModes.split(",").map((s) => s.trim()).includes(filter);
}

export function eventMatchesProbabilityFilter(event: MaintenanceEvent, filter: string): boolean {
  if (filter === "all") return true;
  const p = parseEventProbability(event);
  if (p == null) return false;
  if (filter === "threshold") return p >= eventThresholdRaw(event);
  if (filter === "40") return p >= WATCH_THRESHOLD;
  if (filter === "80") return p >= 0.8;
  return true;
}
