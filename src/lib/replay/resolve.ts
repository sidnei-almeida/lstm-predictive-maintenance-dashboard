import { SEQUENCE_LENGTH } from "@/lib/features/constants";

import { buildCuratedReplayPlan } from "./curated-demo";
import type { CuratedReplayPlan, ReplayMode } from "./types";

export function buildReplayPlans(labels: (0 | 1)[]): {
  curated: CuratedReplayPlan;
} {
  return {
    curated: buildCuratedReplayPlan(labels.length, labels),
  };
}

/** First 50 processed vectors for buffer preload. */
export function preloadIndicesForMode(
  mode: ReplayMode,
  n: number,
  curated: CuratedReplayPlan,
): number[] {
  if (mode === "curated_demo") {
    return curated.indices.slice(0, SEQUENCE_LENGTH);
  }
  return Array.from({ length: Math.min(SEQUENCE_LENGTH, n) }, (_, i) => i);
}

export function resolveRowIndex(
  mode: ReplayMode,
  replayPosition: number,
  curated: CuratedReplayPlan,
  rowCount: number,
): number {
  if (mode === "curated_demo") {
    if (curated.indices.length === 0) return replayPosition % rowCount;
    return curated.indices[replayPosition % curated.indices.length]!;
  }
  return replayPosition % rowCount;
}

export function replayLength(mode: ReplayMode, curated: CuratedReplayPlan, rowCount: number): number {
  if (mode === "curated_demo") {
    return curated.indices.length || rowCount;
  }
  return rowCount;
}
