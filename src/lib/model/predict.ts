/**
 * Request-level inference: validate an incoming sequence, fit it to the model's
 * fixed 50-step window, and turn the raw probability into a labelled decision.
 *
 * The padding/truncation rules mirror the original FastAPI service so existing
 * clients see identical behaviour:
 *   - shorter than 50 steps -> pad by repeating the last row
 *   - longer than 50 steps  -> keep the most recent 50
 */

import { FEATURE_COUNT, SEQUENCE_LENGTH, predictProbability } from "./lstm";

/** Trained decision threshold — metrics/dashboard_metrics.json. */
export const DECISION_THRESHOLD = 0.6;

export const FEATURE_NAMES = [
  "air_temperature_k",
  "process_temperature_k",
  "rotational_speed_rpm",
  "torque_nm",
  "tool_wear_min",
  "type_l",
  "type_m",
] as const;

export class InvalidSequenceError extends Error {}

export type PredictionResult = {
  probability: number;
  predicted_label: 0 | 1;
  threshold: number;
  details: {
    sequence_steps: number;
    features_order: readonly string[];
    uses_simulated_model: false;
  };
};

/**
 * Validate the payload and flatten it into a fixed-size row-major buffer.
 * @throws {InvalidSequenceError} when the shape or values are unusable
 */
function toModelInput(sequence: unknown): { flat: Float32Array; receivedSteps: number } {
  if (!Array.isArray(sequence) || sequence.length === 0) {
    throw new InvalidSequenceError("`sequence` must be a non-empty array of feature vectors.");
  }

  const rows: number[][] = sequence.map((step, index) => {
    if (!Array.isArray(step) || step.length !== FEATURE_COUNT) {
      throw new InvalidSequenceError(
        `Sequence must have shape [steps, ${FEATURE_COUNT}]; step ${index} has ` +
          `${Array.isArray(step) ? step.length : "non-array"} values.`,
      );
    }

    return step.map((value, feature) => {
      const numeric = typeof value === "number" ? value : Number(value);
      if (!Number.isFinite(numeric)) {
        throw new InvalidSequenceError(
          `Step ${index}, feature ${feature} is not a finite number.`,
        );
      }
      return numeric;
    });
  });

  const receivedSteps = rows.length;

  // Keep the most recent window; pad short sequences with their last row.
  const windowed =
    receivedSteps >= SEQUENCE_LENGTH
      ? rows.slice(receivedSteps - SEQUENCE_LENGTH)
      : [
          ...rows,
          ...Array.from({ length: SEQUENCE_LENGTH - receivedSteps }, () => rows[receivedSteps - 1]),
        ];

  const flat = new Float32Array(SEQUENCE_LENGTH * FEATURE_COUNT);
  windowed.forEach((step, t) => {
    for (let f = 0; f < FEATURE_COUNT; f += 1) {
      flat[t * FEATURE_COUNT + f] = step[f];
    }
  });

  return { flat, receivedSteps };
}

export function predictFromSequence(sequence: unknown): PredictionResult {
  const { flat } = toModelInput(sequence);

  const raw = predictProbability(flat);
  const probability = Math.min(1, Math.max(0, raw));

  return {
    probability,
    predicted_label: probability >= DECISION_THRESHOLD ? 1 : 0,
    threshold: DECISION_THRESHOLD,
    details: {
      sequence_steps: SEQUENCE_LENGTH,
      features_order: FEATURE_NAMES,
      uses_simulated_model: false,
    },
  };
}

export { SEQUENCE_LENGTH, FEATURE_COUNT };
