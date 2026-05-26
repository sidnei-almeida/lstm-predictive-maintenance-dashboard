export type ReplayMode = "sequential" | "curated_demo";

export type CuratedSegmentKind =
  | "normal"
  | "degradation"
  | "failure_adjacent"
  | "recovery";

export type CuratedReplayPlan = {
  indices: number[];
  /** Segment kind at each position in `indices` (same length). */
  segments: CuratedSegmentKind[];
};
