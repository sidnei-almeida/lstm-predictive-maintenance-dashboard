"use client";

import Papa from "papaparse";
import { create } from "zustand";

import { predictSequence } from "@/lib/api/client";
import {
  type PredictDebugSnapshot,
  logPredictDebug,
  summarizeSequence,
} from "@/lib/api/debug-inference";
import {
  formatProbabilityPercent,
  getResponseKeys,
  normalizeInferenceFromApi,
} from "@/lib/api/parse-inference";
import { mapCsvRecord } from "@/lib/csv/mapper";
import { SEQUENCE_LENGTH, THRESHOLD_DISPLAY, THRESHOLD_RAW } from "@/lib/features/constants";
import { csvRowToPacket } from "@/lib/features/normalize";
import {
  conditionDriverFromPacket,
  highestStressFactor,
  mostUnstableReading,
  toolWearState,
} from "@/lib/maintenance/heuristics";
import {
  formatDisplayPercentLabel,
  recommendedAction,
} from "@/lib/maintenance/status";
import {
  buildReplayPlans,
  preloadIndicesForMode,
  replayLength,
  resolveRowIndex,
} from "@/lib/replay/resolve";
import {
  buildFailureInjectTargets,
  failureInjectContextIndices,
  segmentEnterEvent,
} from "@/lib/replay/curated-demo";
import type { CuratedReplayPlan, CuratedSegmentKind, ReplayMode } from "@/lib/replay/types";
import {
  appendMaintenanceEvent,
  sequenceRangeFromBuffer,
  type EventPartial,
} from "@/lib/events";
import type {
  ChartPoint,
  CsvRow,
  FeatureVector,
  InferenceSnapshot,
  MachinePacket,
  MaintenanceEvent,
  StreamStatus,
} from "@/lib/types/maintenance";

const REPLAY_INTERVAL_MS = Number(process.env.NEXT_PUBLIC_REPLAY_INTERVAL_MS) || 1000;
const DEFAULT_REPLAY_MODE: ReplayMode = "curated_demo";

let streamTimer: ReturnType<typeof setInterval> | null = null;
let failureRowCursor = 0;

function formatProbDisplay(inference: InferenceSnapshot | null): string {
  return formatProbabilityPercent(inference);
}

function groundTruthFromLabel(label: 0 | 1): "Normal" | "Failure" {
  return label === 1 ? "Failure" : "Normal";
}

function vectorsAtIndices(processedX: FeatureVector[], indices: number[]): FeatureVector[] {
  return indices.map((i) => processedX[i]!);
}

function initialReplayState(
  mode: ReplayMode,
  processedX: FeatureVector[],
  curatedPlan: CuratedReplayPlan,
) {
  const preloadIdx = preloadIndicesForMode(mode, processedX.length, curatedPlan);
  const bufferVectors = vectorsAtIndices(processedX, preloadIdx);
  const activeCuratedSegment: CuratedSegmentKind | null =
    mode === "curated_demo" && curatedPlan.segments.length >= SEQUENCE_LENGTH
      ? (curatedPlan.segments[SEQUENCE_LENGTH - 1] ?? null)
      : null;

  return {
    replayMode: mode,
    curatedPlan,
    replayPosition: SEQUENCE_LENGTH,
    bufferVectors,
    bufferPackets: [] as MachinePacket[],
    activeCuratedSegment,
  };
}

type BootPhase =
  | "shell"
  | "csv"
  | "processed"
  | "api"
  | "buffer"
  | "ready"
  | "error";

export type MaintenanceStore = {
  bootReady: boolean;
  bootPhase: BootPhase;
  bootError: string | null;

  apiHealthy: boolean;
  apiUsesSimulated: boolean | null;

  rows: CsvRow[];
  processedX: FeatureVector[];
  processedY: (0 | 1)[];
  failureInjectTargets: number[];

  replayMode: ReplayMode;
  curatedPlan: CuratedReplayPlan;
  replayPosition: number;
  activeCuratedSegment: CuratedSegmentKind | null;

  streamStatus: StreamStatus;
  packetsProcessed: number;
  streamStartedAt: number | null;

  bufferVectors: FeatureVector[];
  bufferPackets: MachinePacket[];

  latestPacket: MachinePacket | null;
  inference: InferenceSnapshot | null;
  chartPoints: ChartPoint[];
  events: MaintenanceEvent[];
  lastPredictDebug: PredictDebugSnapshot | null;

  startBoot: () => Promise<void>;
  startStream: () => void;
  pauseStream: () => void;
  resetStream: () => void;
  setReplayMode: (mode: ReplayMode) => void;
  injectFailureRisk: () => void;
};

function appendEvent(
  events: MaintenanceEvent[],
  partial: EventPartial,
  row?: CsvRow | null,
): MaintenanceEvent[] {
  return appendMaintenanceEvent(events, partial, row ?? null);
}

export const useMaintenanceStore = create<MaintenanceStore>((set, get) => ({
  bootReady: false,
  bootPhase: "shell",
  bootError: null,

  apiHealthy: false,
  apiUsesSimulated: null,

  rows: [],
  processedX: [],
  processedY: [],
  failureInjectTargets: [],

  replayMode: DEFAULT_REPLAY_MODE,
  curatedPlan: { indices: [], segments: [] },
  replayPosition: SEQUENCE_LENGTH,
  activeCuratedSegment: null,

  streamStatus: "idle",
  packetsProcessed: 0,
  streamStartedAt: null,

  bufferVectors: [],
  bufferPackets: [],

  latestPacket: null,
  inference: null,
  chartPoints: [],
  events: [],
  lastPredictDebug: null,

  startBoot: async () => {
    set({ bootPhase: "shell", bootError: null, bootReady: false });

    try {
      set({ bootPhase: "csv" });
      const csvRes = await fetch("/api/dataset", { cache: "no-store" });
      if (!csvRes.ok) throw new Error("Failed to load historical CSV from data/");

      const csvText = await csvRes.text();
      const parsed = Papa.parse<Record<string, string>>(csvText, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0) {
        throw new Error(parsed.errors[0]?.message ?? "CSV parse error");
      }

      const rows = parsed.data
        .map(mapCsvRecord)
        .filter((r): r is CsvRow => r !== null);

      if (rows.length === 0) throw new Error("No valid rows in dataset");

      set({
        rows,
        events: appendEvent(get().events, {
          packet: "—",
          event: "Dataset loaded",
          eventType: "dataset",
          status: "Ready",
          probability: "—",
          threshold: `${THRESHOLD_DISPLAY}%`,
          groundTruth: "Unknown",
          source: "System",
          conditionDriver: "—",
          action: `${rows.length.toLocaleString()} rows from pred_maint.csv`,
        }),
      });

      set({ bootPhase: "processed" });
      const processedRes = await fetch("/api/processed", { cache: "no-store" });
      if (!processedRes.ok) {
        const err = await processedRes.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ??
            "Failed to load X_processed.npy / y_processed.npy",
        );
      }

      const processed = (await processedRes.json()) as {
        n: number;
        x: FeatureVector[];
        y: (0 | 1)[];
      };

      if (!processed.x?.length || processed.x.length !== rows.length) {
        throw new Error(
          `Processed data misaligned: CSV ${rows.length} rows, X ${processed.x?.length ?? 0}`,
        );
      }

      if (processed.y.length !== rows.length) {
        throw new Error(
          `Processed labels misaligned: CSV ${rows.length} rows, y ${processed.y.length}`,
        );
      }

      const { curated } = buildReplayPlans(processed.y);
      const replayInit = initialReplayState(DEFAULT_REPLAY_MODE, processed.x, curated);

      set({
        processedX: processed.x,
        processedY: processed.y,
        failureInjectTargets: buildFailureInjectTargets(
          processed.y.length,
          processed.y,
        ),
        ...replayInit,
        bootPhase: "buffer",
        events: appendEvent(get().events, {
          packet: "—",
          event: "Processed model data loaded",
          eventType: "dataset",
          status: "Ready",
          probability: "—",
          threshold: `${THRESHOLD_DISPLAY}%`,
          groundTruth: "Unknown",
          source: "System",
          conditionDriver: "—",
          action: `Curated demo replay · ${curated.indices.length} steps · buffer ${SEQUENCE_LENGTH}/${SEQUENCE_LENGTH}`,
        }),
      });

      set({ bootPhase: "api" });
      const { fetchHealth } = await import("@/lib/api/client");
      const health = await fetchHealth();
      const healthy = Object.values(health).some(Boolean);
      if (!healthy) throw new Error("LSTM API reported unhealthy status");

      set({
        apiHealthy: true,
        bootPhase: "ready",
        bootReady: true,
        events: appendEvent(get().events, {
          packet: "—",
          event: "LSTM inference API ready",
          eventType: "api",
          status: "Online",
          probability: "—",
          threshold: `${THRESHOLD_DISPLAY}%`,
          groundTruth: "Unknown",
          source: "System",
          conditionDriver: "—",
          action: `GET /health succeeded · replay mode ${DEFAULT_REPLAY_MODE}`,
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Boot failed";
      set({ bootPhase: "error", bootError: message, bootReady: false });
    }
  },

  startStream: () => {
    const state = get();
    if (!state.bootReady || state.rows.length === 0 || state.processedX.length === 0) return;

    if (streamTimer) clearInterval(streamTimer);

    set({
      streamStatus: "live",
      streamStartedAt: state.streamStartedAt ?? Date.now(),
      events: appendEvent(state.events, {
        packet: String(state.packetsProcessed + 1),
        event: "Stream started",
        eventType: "stream",
        status: "Live",
        probability: formatProbDisplay(state.inference),
        threshold: `${THRESHOLD_DISPLAY}%`,
        groundTruth: "Unknown",
        source: "System",
        conditionDriver: "—",
        action:
          state.replayMode === "curated_demo"
            ? `Curated demo · step ${state.replayPosition} / ${replayLength(state.replayMode, state.curatedPlan, state.rows.length)}`
            : `Sequential · row ${resolveRowIndex(state.replayMode, state.replayPosition, state.curatedPlan, state.rows.length)}`,
      }),
    });

    const tick = () => void processNextRow(get, set);
    tick();
    streamTimer = setInterval(tick, REPLAY_INTERVAL_MS);
  },

  pauseStream: () => {
    if (streamTimer) {
      clearInterval(streamTimer);
      streamTimer = null;
    }
    const state = get();
    set({
      streamStatus: "paused",
      events: appendEvent(state.events, {
        packet: String(state.packetsProcessed),
        event: "Stream paused",
        eventType: "stream",
        status: "Paused",
        probability: formatProbDisplay(state.inference),
        threshold: `${THRESHOLD_DISPLAY}%`,
        groundTruth: "Unknown",
        source: "System",
        conditionDriver: "—",
        action: "Replay halted",
      }),
    });
  },

  resetStream: () => {
    if (streamTimer) {
      clearInterval(streamTimer);
      streamTimer = null;
    }

    const state = get();
    const replayInit =
      state.processedX.length > 0
        ? initialReplayState(state.replayMode, state.processedX, state.curatedPlan)
        : {
            replayPosition: SEQUENCE_LENGTH,
            bufferVectors: [] as FeatureVector[],
            bufferPackets: [] as MachinePacket[],
            activeCuratedSegment: null as CuratedSegmentKind | null,
          };

    set({
      streamStatus: "idle",
      packetsProcessed: 0,
      streamStartedAt: null,
      ...replayInit,
      latestPacket: null,
      inference: null,
      chartPoints: [],
      lastPredictDebug: null,
      events: appendEvent([], {
        packet: "—",
        event: "Simulation reset",
        eventType: "user",
        status: "Idle",
        probability: "—",
        threshold: `${THRESHOLD_DISPLAY}%`,
        groundTruth: "Unknown",
        source: "System",
        conditionDriver: "—",
        action: `Replay mode ${state.replayMode} · buffer ${SEQUENCE_LENGTH}/${SEQUENCE_LENGTH}`,
      }),
    });
  },

  setReplayMode: (mode) => {
    const state = get();
    if (!state.bootReady || state.processedX.length === 0) return;

    if (streamTimer) {
      clearInterval(streamTimer);
      streamTimer = null;
    }

    const replayInit = initialReplayState(mode, state.processedX, state.curatedPlan);

    set({
      ...replayInit,
      streamStatus: "idle",
      packetsProcessed: 0,
      streamStartedAt: null,
      latestPacket: null,
      inference: null,
      chartPoints: [],
      lastPredictDebug: null,
      events: appendEvent(state.events, {
        packet: "—",
        event: mode === "curated_demo" ? "Curated Demo Replay enabled" : "Sequential Replay enabled",
        eventType: "user",
        status: "Ready",
        probability: "—",
        threshold: `${THRESHOLD_DISPLAY}%`,
        groundTruth: "Unknown",
        source: "System",
        conditionDriver: "—",
        action:
          mode === "curated_demo"
            ? `${state.curatedPlan.indices.length} curated historical steps`
            : "Linear CSV row order from index 50",
      }),
    });
  },

  injectFailureRisk: () => {
    const state = get();
    if (!state.bootReady || state.failureInjectTargets.length === 0) return;

    const rowIndex =
      state.failureInjectTargets[failureRowCursor % state.failureInjectTargets.length];
    failureRowCursor += 1;

    void processRowAtIndex(rowIndex, get, set, {
      injected: true,
      pauseAfter: false,
      injectWithContext: true,
    });
  },
}));

async function processNextRow(
  get: () => MaintenanceStore,
  set: (partial: Partial<MaintenanceStore> | ((s: MaintenanceStore) => Partial<MaintenanceStore>)) => void,
) {
  const state = get();
  if (state.streamStatus !== "live" || state.processedX.length === 0) return;

  const replayPosition = state.replayPosition;
  const rowIndex = resolveRowIndex(
    state.replayMode,
    replayPosition,
    state.curatedPlan,
    state.rows.length,
  );

  await processRowAtIndex(rowIndex, get, set, {
    injected: false,
    pauseAfter: false,
    replayPosition,
  });

  const len = replayLength(state.replayMode, state.curatedPlan, state.rows.length);
  set({ replayPosition: (replayPosition + 1) % len });
}

async function processRowAtIndex(
  rowIndex: number,
  get: () => MaintenanceStore,
  set: (partial: Partial<MaintenanceStore> | ((s: MaintenanceStore) => Partial<MaintenanceStore>)) => void,
  options: {
    injected: boolean;
    pauseAfter: boolean;
    replayPosition?: number;
    /** Rebuild rolling window from dataset rows ending at rowIndex (inject demo). */
    injectWithContext?: boolean;
  },
) {
  const state = get();
  const row = state.rows[rowIndex];
  const modelVector = state.processedX[rowIndex];
  const yLabel = state.processedY[rowIndex];
  if (!row || !modelVector) return;

  const replayPosition = options.replayPosition;
  let activeCuratedSegment = state.activeCuratedSegment;

  const packetId = state.packetsProcessed + 1;
  const elapsed = state.streamStartedAt ? Date.now() - state.streamStartedAt : 0;
  const timestamp = new Date((state.streamStartedAt ?? Date.now()) + elapsed);
  const gtLabel = groundTruthFromLabel(yLabel ?? row.machineFailure);

  const packet = csvRowToPacket(row, packetId, timestamp, modelVector, rowIndex);

  let bufferVectors: FeatureVector[];
  let bufferPackets: MachinePacket[];

  if (options.injected && options.injectWithContext) {
    const contextIndices = failureInjectContextIndices(rowIndex);
    bufferVectors = vectorsAtIndices(state.processedX, contextIndices);
    const streamBase = state.streamStartedAt ?? Date.now();
    bufferPackets = contextIndices.map((ri, offset) => {
      const contextRow = state.rows[ri]!;
      const contextVector = state.processedX[ri]!;
      const contextTime = new Date(streamBase + offset * 100);
      const contextPacketId =
        offset === contextIndices.length - 1
          ? packetId
          : Math.max(1, packetId - (contextIndices.length - 1 - offset));
      return csvRowToPacket(
        contextRow,
        contextPacketId,
        contextTime,
        contextVector,
        ri,
      );
    });
  } else {
    bufferVectors = [...state.bufferVectors, modelVector].slice(-SEQUENCE_LENGTH);
    bufferPackets = [...state.bufferPackets, packet].slice(-SEQUENCE_LENGTH);
  }
  const isReady = bufferVectors.length >= SEQUENCE_LENGTH;
  const seqRange = sequenceRangeFromBuffer(bufferPackets.map((p) => p.rowIndex));

  let events = state.events;

  if (
    state.replayMode === "curated_demo" &&
    replayPosition != null &&
    replayPosition < state.curatedPlan.segments.length
  ) {
    const segment = state.curatedPlan.segments[replayPosition];
    if (segment && segment !== activeCuratedSegment) {
      events = appendEvent(
        events,
        {
          packet: String(packetId),
          packetId,
          rowIndex,
          event: segmentEnterEvent(segment),
          eventType: "stream",
          status: "Replay",
          probability: formatProbDisplay(state.inference),
          threshold: `${THRESHOLD_DISPLAY}%`,
          groundTruth: gtLabel,
          source: "System",
          conditionDriver: segment,
          action: `Dataset row ${rowIndex}`,
          sequenceRange: seqRange,
        },
        row,
      );
      activeCuratedSegment = segment;
    }
  }

  if (yLabel === 1) {
    events = appendEvent(
      events,
      {
        packet: String(packetId),
        packetId,
        rowIndex,
        event: "Known failure row replayed",
        eventType: "alert",
        status: "Ground truth",
        probability: formatProbDisplay(state.inference),
        threshold: `${THRESHOLD_DISPLAY}%`,
        groundTruth: "Failure",
        source: "CSV Replay",
        conditionDriver: conditionDriverFromPacket(packet),
        action: `Historical index ${rowIndex}`,
        sequenceRange: seqRange,
      },
      row,
    );
  }

  if (!options.injected) {
    events = appendEvent(
      events,
      {
        packet: String(packetId),
        packetId,
        rowIndex,
        event: "CSV row streamed",
        eventType: "stream",
        status: "Packet",
        probability: formatProbDisplay(state.inference),
        threshold: `${THRESHOLD_DISPLAY}%`,
        groundTruth: gtLabel,
        source: "CSV Replay",
        conditionDriver: conditionDriverFromPacket(packet),
        action: `UDI ${row.udi}`,
        sequenceRange: seqRange,
      },
      row,
    );

    events = appendEvent(
      events,
      {
        packet: String(packetId),
        packetId,
        rowIndex,
        event: "Sequence buffer updated",
        eventType: "stream",
        status: `${bufferVectors.length} / ${SEQUENCE_LENGTH}`,
        probability: formatProbDisplay(state.inference),
        threshold: `${THRESHOLD_DISPLAY}%`,
        groundTruth: gtLabel,
        source: "System",
        conditionDriver: highestStressFactor(packet),
        action: "X_processed row appended to rolling window",
        sequenceRange: seqRange,
      },
      row,
    );
  }

  let inference = state.inference;
  let chartPoints = state.chartPoints;
  let apiUsesSimulated = state.apiUsesSimulated;
  let lastPredictDebug = state.lastPredictDebug;

  if (isReady) {
    try {
      const { data, latencyMs } = await predictSequence(bufferVectors);
      const seqSummary = summarizeSequence(bufferVectors);
      const responseKeys = getResponseKeys(data);

      const normalized = normalizeInferenceFromApi({
        payload: data,
        groundTruthMachineFailure: yLabel ?? row.machineFailure,
        latencyMs,
        usesSimulatedModel: data.details?.uses_simulated_model,
      });

      const debugSnapshot: PredictDebugSnapshot = {
        at: new Date().toISOString(),
        ...seqSummary,
        rawResponse: data,
        responseKeys,
        apiFieldUsed: normalized?.apiFieldUsed ?? null,
        rawProbability: normalized?.rawProbability ?? null,
        displayProbability: normalized?.displayProbability ?? null,
        predictedLabel: normalized?.predictedLabel ?? null,
        groundTruthLabel: normalized?.groundTruthLabel ?? gtLabel,
      };

      logPredictDebug(debugSnapshot);
      lastPredictDebug = debugSnapshot;

      if (!normalized) {
        events = appendEvent(
          events,
          {
            packet: String(packetId),
            packetId,
            rowIndex,
            event: "API request failed — missing probability",
            eventType: "api",
            status: "Error",
            probability: "—",
            threshold: `${THRESHOLD_DISPLAY}%`,
            groundTruth: gtLabel,
            source: "LSTM API",
            conditionDriver: "—",
            action: `Keys: ${responseKeys.join(", ") || "none"} — expected probability`,
            latencyMs,
            sequenceRange: seqRange,
          },
          row,
        );
      } else {
        inference = normalized;
        apiUsesSimulated = normalized.usesSimulatedModel;

        const prediction = normalized.status;
        const chartPoint: ChartPoint = {
          timestamp: timestamp.getTime(),
          packetId,
          probabilityDisplay: normalized.displayProbability,
          thresholdDisplay: normalized.thresholdDisplay,
          status: prediction,
          groundTruth: normalized.groundTruthLabel,
          productType: row.type,
          toolWear: row.toolWearMin,
          knownFailure: yLabel === 1,
        };

        chartPoints = [...chartPoints, chartPoint].slice(-500);

        events = appendEvent(
          events,
          {
            packet: String(packetId),
            packetId,
            rowIndex,
            event: `LSTM prediction processed — Failure probability ${formatDisplayPercentLabel(normalized.displayProbability, normalized.rawProbability)}`,
            eventType: "prediction",
            status: prediction,
            probability: formatDisplayPercentLabel(
              normalized.displayProbability,
              normalized.rawProbability,
            ),
            rawProbability: normalized.rawProbability,
            displayProbability: normalized.displayProbability,
            threshold: `${normalized.thresholdDisplay}%`,
            thresholdRaw: normalized.thresholdRaw,
            predictedLabel: normalized.predictedLabel,
            groundTruth: normalized.groundTruthLabel,
            source: "LSTM API",
            conditionDriver: conditionDriverFromPacket(packet),
            action: recommendedAction(prediction),
            latencyMs,
            usesSimulatedModel: normalized.usesSimulatedModel,
            sequenceRange: seqRange,
          },
          row,
        );

        if (options.injected) {
          const contextIndices = failureInjectContextIndices(rowIndex);
          const contextStart = contextIndices[0] ?? rowIndex;
          events = appendEvent(
            events,
            {
              packet: String(packetId),
              packetId,
              rowIndex,
              event: "Failure risk injected",
              eventType: "user",
              status: prediction,
              probability: formatDisplayPercentLabel(
                normalized.displayProbability,
                normalized.rawProbability,
              ),
              rawProbability: normalized.rawProbability,
              displayProbability: normalized.displayProbability,
              threshold: `${normalized.thresholdDisplay}%`,
              thresholdRaw: normalized.thresholdRaw,
              predictedLabel: normalized.predictedLabel,
              groundTruth: normalized.groundTruthLabel,
              source: "User",
              conditionDriver: conditionDriverFromPacket(packet),
              action: `LSTM window rows ${contextStart}–${rowIndex} · failure index ${rowIndex}`,
              latencyMs,
              usesSimulatedModel: normalized.usesSimulatedModel,
              sequenceRange: seqRange,
            },
            row,
          );
        }

        const prevRaw = state.inference?.rawProbability;
        if (
          prevRaw != null &&
          prevRaw < THRESHOLD_RAW &&
          normalized.rawProbability >= THRESHOLD_RAW
        ) {
          events = appendEvent(
            events,
            {
              packet: String(packetId),
              packetId,
              rowIndex,
              event: "Maintenance risk detected",
              eventType: "alert",
              status: "Maintenance Risk",
              probability: formatDisplayPercentLabel(
                normalized.displayProbability,
                normalized.rawProbability,
              ),
              rawProbability: normalized.rawProbability,
              displayProbability: normalized.displayProbability,
              threshold: `${normalized.thresholdDisplay}%`,
              thresholdRaw: normalized.thresholdRaw,
              predictedLabel: normalized.predictedLabel,
              groundTruth: normalized.groundTruthLabel,
              source: "LSTM API",
              conditionDriver: conditionDriverFromPacket(packet),
              action: "Model probability crossed maintenance threshold",
              latencyMs,
              usesSimulatedModel: normalized.usesSimulatedModel,
              sequenceRange: seqRange,
            },
            row,
          );
        }

        if (normalized.rawProbability >= 0.4 && normalized.rawProbability < THRESHOLD_RAW) {
          events = appendEvent(
            events,
            {
              packet: String(packetId),
              packetId,
              rowIndex,
              event: "Elevated risk threshold reached",
              eventType: "alert",
              status: "Elevated Risk",
              probability: formatDisplayPercentLabel(
                normalized.displayProbability,
                normalized.rawProbability,
              ),
              rawProbability: normalized.rawProbability,
              displayProbability: normalized.displayProbability,
              threshold: `${normalized.thresholdDisplay}%`,
              thresholdRaw: normalized.thresholdRaw,
              predictedLabel: normalized.predictedLabel,
              groundTruth: normalized.groundTruthLabel,
              source: "LSTM API",
              conditionDriver: highestStressFactor(packet),
              action: "Monitor tool wear trend",
              latencyMs,
              sequenceRange: seqRange,
            },
            row,
          );
        }

      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Predict failed";
      events = appendEvent(
        events,
        {
          packet: String(packetId),
          packetId,
          rowIndex,
          event: "API request failed",
          eventType: "api",
          status: "Error",
          probability: "—",
          threshold: `${THRESHOLD_DISPLAY}%`,
          groundTruth: gtLabel,
          source: "LSTM API",
          conditionDriver: "—",
          action: message,
          sequenceRange: seqRange,
        },
        row,
      );
    }
  }

  set({
    bufferVectors,
    bufferPackets,
    latestPacket: packet,
    packetsProcessed: packetId,
    inference,
    chartPoints,
    events,
    apiUsesSimulated,
    lastPredictDebug,
    activeCuratedSegment,
  });

  if (options.pauseAfter && streamTimer) {
    clearInterval(streamTimer);
    streamTimer = null;
    set({ streamStatus: "paused" });
  }
}

/** Selectors for UI */
export function selectSequenceFill(state: MaintenanceStore): number {
  return state.bufferVectors.length;
}

export function selectSequencePhase(state: MaintenanceStore): "idle" | "building" | "ready" | "inference_active" {
  if (state.bufferVectors.length === 0) return "idle";
  if (state.bufferVectors.length < SEQUENCE_LENGTH) return "building";
  if (state.streamStatus === "live") return "inference_active";
  return "ready";
}

export function selectLiveStatus(state: MaintenanceStore): string {
  if (state.streamStatus === "live") return "Streaming";
  if (state.streamStatus === "paused") return "Paused";
  return "Offline";
}

export function selectWindowRange(state: MaintenanceStore): string {
  if (state.bufferPackets.length === 0) {
    if (state.bufferVectors.length >= SEQUENCE_LENGTH) {
      if (state.replayMode === "curated_demo" && state.curatedPlan.indices.length >= SEQUENCE_LENGTH) {
        const a = state.curatedPlan.indices[0];
        const b = state.curatedPlan.indices[SEQUENCE_LENGTH - 1];
        return `curated ${a}–${b}`;
      }
      return `rows 0–${SEQUENCE_LENGTH - 1}`;
    }
    return "—";
  }
  const start = state.bufferPackets[0]?.packetId ?? "—";
  const end = state.bufferPackets[state.bufferPackets.length - 1]?.packetId ?? "—";
  return `${start} → ${end}`;
}

export function selectReplayProgress(state: MaintenanceStore): string {
  if (state.rows.length === 0) return "—";
  const len = replayLength(state.replayMode, state.curatedPlan, state.rows.length);
  const row = resolveRowIndex(
    state.replayMode,
    state.replayPosition,
    state.curatedPlan,
    state.rows.length,
  );
  if (state.replayMode === "curated_demo") {
    return `Step ${state.replayPosition} / ${len} · row ${row}`;
  }
  return `Row ${row} / ${state.rows.length.toLocaleString()}`;
}

export type { ReplayMode };

export { highestStressFactor, mostUnstableReading, toolWearState };
