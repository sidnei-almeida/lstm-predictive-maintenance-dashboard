import type { FeatureVector } from "@/lib/types/maintenance";

export type PredictDebugSnapshot = {
  at: string;
  sequenceLength: number;
  firstVector: number[];
  lastVector: number[];
  rawResponse: unknown;
  responseKeys: string[];
  apiFieldUsed: string | null;
  rawProbability: number | null;
  displayProbability: number | null;
  predictedLabel: number | null;
  groundTruthLabel: string;
};

const DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_INFERENCE === "true" ||
  process.env.NODE_ENV === "development";

export function isInferenceDebugEnabled(): boolean {
  return DEBUG_ENABLED;
}

export function logPredictDebug(snapshot: PredictDebugSnapshot): void {
  if (!DEBUG_ENABLED) return;

  console.groupCollapsed(
    `[PM Inference] packet predict · ${snapshot.apiFieldUsed ?? "no probability"} → ${snapshot.displayProbability ?? "—"}%`,
  );
  console.log("sequence length:", snapshot.sequenceLength);
  console.log("first vector (scaled):", snapshot.firstVector);
  console.log("last vector (scaled):", snapshot.lastVector);
  console.log("raw /predict response:", snapshot.rawResponse);
  console.log("response keys:", snapshot.responseKeys);
  console.log("rawProbability:", snapshot.rawProbability);
  console.log("displayProbability:", snapshot.displayProbability);
  console.log("predictedLabel (derived):", snapshot.predictedLabel);
  console.log("groundTruthLabel:", snapshot.groundTruthLabel);
  console.groupEnd();
}

export function summarizeSequence(sequence: FeatureVector[]): {
  sequenceLength: number;
  firstVector: number[];
  lastVector: number[];
} {
  return {
    sequenceLength: sequence.length,
    firstVector: sequence[0] ? [...sequence[0]] : [],
    lastVector: sequence.length ? [...sequence[sequence.length - 1]] : [],
  };
}
