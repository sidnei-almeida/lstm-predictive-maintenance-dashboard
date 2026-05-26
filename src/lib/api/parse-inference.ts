import { THRESHOLD_DISPLAY, THRESHOLD_RAW } from "@/lib/features/constants";
import {
  deriveHealth,
  derivePrediction,
  deriveRiskBand,
  formatDisplayPercentLabel,
  groundTruthLabel,
  toDisplayPercent,
} from "@/lib/maintenance/status";
import type { InferenceSnapshot, PredictionLabel } from "@/lib/types/maintenance";

export type ApiProbabilityField =
  | "predicted_probability"
  | "probability"
  | "prediction_probability"
  | null;

/** Never treat these as continuous probability */
const EXCLUDED_PROBABILITY_KEYS = new Set([
  "label",
  "predicted_label",
  "prediction",
  "predictedLabel",
  "class",
  "classes",
]);

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeRawProbability(value: number): number {
  if (value > 1 && value <= 100) return value / 100;
  return value;
}

function isPlausibleContinuousProbability(raw: number): boolean {
  return raw >= 0 && raw <= 1;
}

/**
 * Parse continuous failure probability from API payload.
 * Priority: predicted_probability → probability → prediction_probability.
 * Does NOT use label, predicted_label, or binary class fields.
 */
export function parseRawProbability(payload: unknown): {
  rawProbability: number;
  apiFieldUsed: ApiProbabilityField;
} | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const candidates: [NonNullable<ApiProbabilityField>, unknown][] = [
    ["predicted_probability", record.predicted_probability],
    ["probability", record.probability],
    ["prediction_probability", record.prediction_probability],
  ];

  for (const [field, value] of candidates) {
    const num = toNumber(value);
    if (num === null) continue;
    const raw = normalizeRawProbability(num);
    if (isPlausibleContinuousProbability(raw)) {
      return { rawProbability: raw, apiFieldUsed: field };
    }
  }

  // Optional: score only when clearly continuous (not binary 0/1 class)
  const score = toNumber(record.score);
  if (score !== null) {
    const raw = normalizeRawProbability(score);
    if (isPlausibleContinuousProbability(raw) && raw > 0.001 && raw < 0.999) {
      return { rawProbability: raw, apiFieldUsed: "probability" };
    }
  }

  return null;
}

export function getResponseKeys(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  return Object.keys(payload as Record<string, unknown>).sort();
}

/** Ground truth from dataset `label` only — never from model outputs. */
export function parseGroundTruthFromApi(payload: unknown): "Normal" | "Failure" | "Unknown" {
  if (!payload || typeof payload !== "object") return "Unknown";

  const record = payload as Record<string, unknown>;
  if (EXCLUDED_PROBABILITY_KEYS.has("label") && typeof record.label === "number") {
    return record.label >= 0.5 ? "Failure" : "Normal";
  }
  if (typeof record.label === "number") {
    return record.label >= 0.5 ? "Failure" : "Normal";
  }
  if (typeof record.label === "boolean") {
    return record.label ? "Failure" : "Normal";
  }

  return "Unknown";
}

function parseThreshold(payload: unknown): number {
  if (!payload || typeof payload !== "object") return THRESHOLD_RAW;
  const threshold = toNumber((payload as Record<string, unknown>).threshold);
  if (threshold === null) return THRESHOLD_RAW;
  if (threshold > 1 && threshold <= 100) return threshold / 100;
  return threshold;
}

function parseUsesSimulatedModel(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const details = (payload as Record<string, unknown>).details;
  if (details && typeof details === "object") {
    return Boolean((details as Record<string, unknown>).uses_simulated_model);
  }
  return false;
}

export function normalizeInferenceFromApi(params: {
  payload: unknown;
  groundTruthMachineFailure?: 0 | 1;
  latencyMs: number;
  usesSimulatedModel?: boolean;
}): InferenceSnapshot | null {
  const parsed = parseRawProbability(params.payload);
  if (!parsed) return null;

  const { rawProbability, apiFieldUsed } = parsed;
  const thresholdRaw = parseThreshold(params.payload);
  const thresholdDisplay = THRESHOLD_DISPLAY;
  const displayProbability = toDisplayPercent(rawProbability);
  const predictedLabel: 0 | 1 = rawProbability >= thresholdRaw ? 1 : 0;

  const groundTruthFromApi = parseGroundTruthFromApi(params.payload);
  const groundTruthLabelValue =
    params.groundTruthMachineFailure !== undefined
      ? groundTruthLabel(params.groundTruthMachineFailure)
      : groundTruthFromApi !== "Unknown"
        ? groundTruthFromApi
        : "Unknown";

  const status: PredictionLabel = derivePrediction(rawProbability);
  const health = deriveHealth(rawProbability);
  const riskBand = deriveRiskBand(rawProbability);
  const usesSimulatedModel =
    params.usesSimulatedModel ?? parseUsesSimulatedModel(params.payload);

  return {
    rawProbability,
    displayProbability,
    predictedLabel,
    thresholdRaw,
    thresholdDisplay,
    groundTruthLabel: groundTruthLabelValue,
    status,
    apiFieldUsed: apiFieldUsed ?? "unknown",
    usesSimulatedModel,
    latencyMs: params.latencyMs,
    health,
    riskBand,
    prediction: status,
    probability: rawProbability,
    probabilityDisplay: displayProbability,
    threshold: thresholdRaw,
  };
}

export function formatProbabilityPercent(inference: InferenceSnapshot | null): string {
  if (!inference) return "—";
  return formatDisplayPercentLabel(inference.displayProbability, inference.rawProbability);
}
