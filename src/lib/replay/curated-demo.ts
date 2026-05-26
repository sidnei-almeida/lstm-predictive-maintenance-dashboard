import { SEQUENCE_LENGTH } from "@/lib/features/constants";

import type { CuratedReplayPlan, CuratedSegmentKind } from "./types";

const NORMAL_SEGMENT_LEN = 100;
const DEGRADATION_BEFORE = 45;
const RECOVERY_AFTER = 50;
const TARGET_MIN_LENGTH = 420;
const MAX_FAILURE_WINDOWS = 5;

function rangeInclusive(start: number, end: number): number[] {
  const lo = Math.max(0, Math.min(start, end));
  const hi = Math.max(0, Math.max(start, end));
  const out: number[] = [];
  for (let i = lo; i <= hi; i += 1) out.push(i);
  return out;
}

function appendChunk(
  target: number[],
  segments: CuratedSegmentKind[],
  chunk: number[],
  kind: CuratedSegmentKind,
  seen: Set<number>,
): void {
  for (const index of chunk) {
    if (seen.has(index)) continue;
    seen.add(index);
    target.push(index);
    segments.push(kind);
  }
}

/** Longest run of normal rows (y=0) with at least `minLen` samples. */
function findNormalRunStart(labels: (0 | 1)[], minLen: number): number {
  let bestStart = 0;
  let bestLen = 0;
  let runStart = 0;
  let runLen = 0;

  for (let i = 0; i < labels.length; i += 1) {
    if (labels[i] === 0) {
      if (runLen === 0) runStart = i;
      runLen += 1;
      if (runLen > bestLen) {
        bestLen = runLen;
        bestStart = runStart;
      }
    } else {
      runLen = 0;
    }
  }

  if (bestLen >= minLen) return bestStart;
  return 0;
}

function pickEvenlySpaced<T>(items: T[], count: number): T[] {
  if (items.length <= count) return [...items];
  const out: T[] = [];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.floor((i * (items.length - 1)) / Math.max(1, count - 1));
    out.push(items[idx]!);
  }
  return out;
}

function failureWindow(
  failureIndex: number,
  windowIndex: number,
  n: number,
): number[] {
  const beforeLen = 30 + (windowIndex * 7) % 31;
  const afterLen = 20 + (windowIndex * 5) % 21;
  return rangeInclusive(failureIndex - beforeLen, failureIndex + afterLen).filter(
    (i) => i < n,
  );
}

function buildNormalChunks(labels: (0 | 1)[], n: number, chunkSize = 35): number[][] {
  const chunks: number[][] = [];
  let i = 0;
  while (i < n) {
    if (labels[i] !== 0) {
      i += 1;
      continue;
    }
    const start = i;
    while (i < n && labels[i] === 0) i += 1;
    const len = i - start;
    if (len >= chunkSize) {
      for (let o = start; o + chunkSize <= i; o += chunkSize) {
        chunks.push(rangeInclusive(o, o + chunkSize - 1));
      }
    }
  }
  return chunks;
}

function buildFailureChunks(failureIndices: number[], n: number): number[][] {
  return failureIndices.map((f, idx) => failureWindow(f, idx, n));
}

/**
 * Deterministic curated replay order using only real dataset row indices.
 */
export function buildCuratedReplayPlan(
  n: number,
  labels: (0 | 1)[],
): CuratedReplayPlan {
  const failureIndices = labels
    .map((y, i) => (y === 1 ? i : -1))
    .filter((i) => i >= 0);

  const indices: number[] = [];
  const segments: CuratedSegmentKind[] = [];
  const seen = new Set<number>();

  const normalStart = findNormalRunStart(labels, NORMAL_SEGMENT_LEN);
  appendChunk(
    indices,
    segments,
    rangeInclusive(normalStart, normalStart + NORMAL_SEGMENT_LEN - 1).filter((i) => i < n),
    "normal",
    seen,
  );

  const selectedFailures = pickEvenlySpaced(
    failureIndices,
    Math.min(MAX_FAILURE_WINDOWS, failureIndices.length),
  );

  if (selectedFailures.length > 0) {
    const firstFailure = selectedFailures[0]!;
    appendChunk(
      indices,
      segments,
      rangeInclusive(firstFailure - DEGRADATION_BEFORE, firstFailure - 1).filter(
        (i) => i >= 0,
      ),
      "degradation",
      seen,
    );

    selectedFailures.forEach((f, windowIndex) => {
      appendChunk(
        indices,
        segments,
        failureWindow(f, windowIndex, n),
        "failure_adjacent",
        seen,
      );
    });

    const lastFailure = selectedFailures[selectedFailures.length - 1]!;
    appendChunk(
      indices,
      segments,
      rangeInclusive(lastFailure + 1, lastFailure + RECOVERY_AFTER).filter(
        (i) => i < n && labels[i] === 0,
      ),
      "recovery",
      seen,
    );
  }

  if (indices.length < TARGET_MIN_LENGTH) {
    const normalChunks = buildNormalChunks(labels, n);
    const failureChunks = buildFailureChunks(
      pickEvenlySpaced(failureIndices, Math.min(12, failureIndices.length)),
      n,
    );

    let normalIdx = 0;
    let failureIdx = 0;
    let tick = 0;

    while (indices.length < TARGET_MIN_LENGTH && (normalChunks.length > 0 || failureChunks.length > 0)) {
      const useNormal = tick % 10 < 7;
      if (useNormal && normalChunks.length > 0) {
        const chunk = normalChunks[normalIdx % normalChunks.length]!;
        normalIdx += 1;
        appendChunk(indices, segments, chunk, "normal", seen);
      } else if (failureChunks.length > 0) {
        const chunk = failureChunks[failureIdx % failureChunks.length]!;
        failureIdx += 1;
        appendChunk(indices, segments, chunk, "failure_adjacent", seen);
      } else if (normalChunks.length > 0) {
        const chunk = normalChunks[normalIdx % normalChunks.length]!;
        normalIdx += 1;
        appendChunk(indices, segments, chunk, "normal", seen);
      } else {
        break;
      }
      tick += 1;
    }
  }

  return { indices, segments };
}

/**
 * Failure row indices suitable for demo inject (full LSTM window + curated spread).
 * Inject replays the 50-step context ending at each target, not an isolated row.
 */
export function buildFailureInjectTargets(n: number, labels: (0 | 1)[]): number[] {
  const failureIndices = labels
    .map((y, i) => (y === 1 ? i : -1))
    .filter((i) => i >= SEQUENCE_LENGTH - 1 && i < n);

  return pickEvenlySpaced(
    failureIndices,
    Math.min(8, failureIndices.length),
  );
}

export function failureInjectContextIndices(failureIndex: number): number[] {
  const start = Math.max(0, failureIndex - SEQUENCE_LENGTH + 1);
  const indices: number[] = [];
  for (let i = start; i <= failureIndex; i += 1) indices.push(i);
  return indices;
}

export function segmentKindLabel(kind: CuratedSegmentKind): string {
  switch (kind) {
    case "normal":
      return "normal operating segment";
    case "degradation":
      return "warning/degradation segment";
    case "failure_adjacent":
      return "failure-adjacent historical segment";
    case "recovery":
      return "recovery/normal segment";
    default:
      return "curated segment";
  }
}

export function segmentEnterEvent(kind: CuratedSegmentKind): string {
  if (kind === "failure_adjacent") {
    return "Replay entered failure-adjacent historical segment";
  }
  return `Replay entered ${segmentKindLabel(kind)}`;
}
