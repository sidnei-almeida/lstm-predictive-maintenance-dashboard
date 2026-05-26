import type { ProcessedDataset } from "@/lib/data/processed-cache";
import { SEQUENCE_LENGTH } from "@/lib/features/constants";

import type { ProcessedTensorSummary } from "./types";

function round(n: number, d = 4): number {
  const p = 10 ** d;
  return Math.round(n * p) / p;
}

export function computeProcessedTensorSummary(
  dataset: ProcessedDataset,
): ProcessedTensorSummary {
  const { n, features, x, y } = dataset;
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (const row of x) {
    for (const v of row) {
      if (!Number.isFinite(v)) continue;
      min = Math.min(min, v);
      max = Math.max(max, v);
      sum += v;
      sumSq += v * v;
      count += 1;
    }
  }

  const mean = count > 0 ? sum / count : 0;
  const variance = count > 0 ? sumSq / count - mean * mean : 0;
  const labelOnes = y.filter((v) => v === 1).length;

  return {
    xShape: `[${n}, ${features}]`,
    yShape: `[${n}]`,
    featureCount: features,
    sequenceLength: SEQUENCE_LENGTH,
    layout: "[N, 7] per timestep",
    valueMin: round(min === Infinity ? 0 : min),
    valueMax: round(max === -Infinity ? 0 : max),
    valueMean: round(mean),
    valueStd: round(Math.sqrt(Math.max(variance, 0))),
    labelOnes,
    labelZeros: n - labelOnes,
  };
}
