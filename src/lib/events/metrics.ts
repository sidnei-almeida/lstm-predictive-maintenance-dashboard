import { THRESHOLD_RAW, WATCH_THRESHOLD } from "@/lib/features/constants";

import {
  deriveModelPrediction,
  displayEventType,
  eventMatchesFailureModeFilter,
  eventMatchesPredictionFilter,
  eventMatchesProbabilityFilter,
  isPredictionGroundTruthMismatch,
  isPredictedFailureRisk,
  isProcessedPredictionEvent,
  parseEventProbability,
} from "./prediction";
import type { EventFilters, MaintenanceEvent } from "./types";

export {
  deriveModelPrediction,
  deriveModelRiskBand,
  displayEventType,
  isProcessedPredictionEvent,
} from "./prediction";

export function filterEvents(events: MaintenanceEvent[], filters: EventFilters): MaintenanceEvent[] {
  return events.filter((e) => {
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const hay = [
        e.event,
        e.packet,
        e.groundTruth,
        e.source,
        e.action,
        e.failureModes,
        e.productId,
        deriveModelPrediction(e),
        displayEventType(e),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }

    if (!eventMatchesPredictionFilter(e, filters.prediction)) return false;

    if (filters.groundTruth !== "all") {
      if (filters.groundTruth === "Normal" && e.groundTruth !== "Normal") return false;
      if (filters.groundTruth === "Failure" && e.groundTruth !== "Failure") return false;
    }

    if (!eventMatchesFailureModeFilter(e, filters.failureMode)) return false;

    if (filters.eventType !== "all") {
      const displayed = displayEventType(e);
      const typeMap: Record<string, string> = {
        stream: "Stream",
        prediction: "Prediction",
        dataset: "Dataset",
        api: "API",
        user: "User Action",
        system: "System",
      };
      if (typeMap[filters.eventType] !== displayed) return false;
    }

    if (!eventMatchesProbabilityFilter(e, filters.minProbability)) return false;

    return true;
  });
}

export type HistoryKpis = {
  eventsRecorded: number;
  predictionsProcessed: number;
  predictedFailureRisk: number;
  knownFailureRows: number;
  modelGroundTruthMismatches: number;
  averageProbability: string;
  apiEvents: number;
};

export function computeHistoryKpis(events: MaintenanceEvent[]): HistoryKpis {
  const predictionEvents = events.filter(isProcessedPredictionEvent);

  const knownFailureRows = new Set(
    events
      .filter((e) => e.event.toLowerCase().includes("known failure row"))
      .map((e) => e.rowIndex ?? e.packetId)
      .filter((x) => x != null),
  ).size;

  const probs = predictionEvents
    .map((e) => parseEventProbability(e))
    .filter((p): p is number => p != null);

  const avgProb =
    probs.length > 0
      ? `${((probs.reduce((a, b) => a + b, 0) / probs.length) * 100).toFixed(1)}%`
      : "—";

  return {
    eventsRecorded: events.length,
    predictionsProcessed: predictionEvents.length,
    predictedFailureRisk: predictionEvents.filter(isPredictedFailureRisk).length,
    knownFailureRows,
    modelGroundTruthMismatches: predictionEvents.filter(isPredictionGroundTruthMismatch).length,
    averageProbability: avgProb,
    apiEvents: events.filter(
      (e) =>
        e.eventType === "api" ||
        e.statusKind === "api" ||
        e.event.toLowerCase().includes("api") ||
        e.event.toLowerCase().includes("health"),
    ).length,
  };
}

export type OutcomeSummary = {
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  missedFailures: number;
  hasData: boolean;
  precision: string;
  recall: string;
};

export function computeOutcomeSummary(events: MaintenanceEvent[]): OutcomeSummary {
  const preds = events.filter(
    (e) =>
      isProcessedPredictionEvent(e) &&
      (e.groundTruth === "Normal" || e.groundTruth === "Failure"),
  );

  let tp = 0;
  let fp = 0;
  let tn = 0;
  let fn = 0;

  for (const e of preds) {
    const risk = isPredictedFailureRisk(e);
    const gtF = e.groundTruth === "Failure";
    const gtN = e.groundTruth === "Normal";
    if (risk && gtF) tp += 1;
    else if (risk && gtN) fp += 1;
    else if (!risk && gtN) tn += 1;
    else if (!risk && gtF) fn += 1;
  }

  const precision = tp + fp > 0 ? `${((tp / (tp + fp)) * 100).toFixed(1)}%` : "—";
  const recall = tp + fn > 0 ? `${((tp / (tp + fn)) * 100).toFixed(1)}%` : "—";

  return {
    truePositives: tp,
    falsePositives: fp,
    trueNegatives: tn,
    missedFailures: fn,
    hasData: preds.length > 0,
    precision,
    recall,
  };
}

export type TimelinePoint = {
  index: number;
  packetId: number;
  probability: number;
  kind: "low" | "elevated" | "failure_risk" | "known_failure";
  time: string;
};

export function buildRiskTimeline(events: MaintenanceEvent[]): TimelinePoint[] {
  const preds = [...events].filter(isProcessedPredictionEvent).reverse();

  return preds.map((e, index) => {
    const p = parseEventProbability(e) ?? 0;
    let kind: TimelinePoint["kind"] = "low";
    if (e.groundTruth === "Failure" || e.event.toLowerCase().includes("known failure")) {
      kind = "known_failure";
    } else if (p >= THRESHOLD_RAW || e.predictedLabel === 1) kind = "failure_risk";
    else if (p >= WATCH_THRESHOLD) kind = "elevated";

    return {
      index,
      packetId: e.packetId ?? index,
      probability: p * 100,
      kind,
      time: e.time.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  });
}

export function sessionFailureModeCounts(events: MaintenanceEvent[]): Record<string, number> {
  const counts = { TWF: 0, HDF: 0, PWF: 0, OSF: 0, RNF: 0 };
  const seen = new Set<number>();

  for (const e of events) {
    if (e.failureModes === "—" || e.rowIndex == null) continue;
    if (e.groundTruth !== "Failure" && !e.event.toLowerCase().includes("known failure")) continue;
    if (seen.has(e.rowIndex)) continue;
    seen.add(e.rowIndex);
    for (const mode of e.failureModes.split(",").map((s) => s.trim())) {
      if (mode in counts) counts[mode as keyof typeof counts] += 1;
    }
  }

  return counts;
}

export type ApiEventStats = {
  healthy: boolean;
  lastHealthLabel: string;
  avgLatencyMs: string;
  failedRequests: number;
  apiHost: string;
  modelEngine: string;
};

export function computeApiStats(
  events: MaintenanceEvent[],
  apiHealthy: boolean,
  apiUsesSimulated: boolean | null,
  apiBaseUrl: string,
): ApiEventStats {
  const latencies = events
    .map((e) => e.latencyMs)
    .filter((n): n is number => n != null && Number.isFinite(n));

  const avg =
    latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : null;

  const failed = events.filter(
    (e) =>
      e.statusKind === "error" ||
      e.event.toLowerCase().includes("failed") ||
      e.event.toLowerCase().includes("missing probability"),
  ).length;

  const lastHealth = events.find(
    (e) =>
      e.event.toLowerCase().includes("api ready") ||
      e.event.toLowerCase().includes("health"),
  );

  let host = apiBaseUrl;
  try {
    host = new URL(apiBaseUrl).host;
  } catch {
    /* keep raw */
  }

  const modelEngine =
    apiUsesSimulated === true
      ? "Simulated API Model"
      : apiUsesSimulated === false
        ? "TensorFlow LSTM"
        : "—";

  return {
    healthy: apiHealthy,
    lastHealthLabel: lastHealth
      ? lastHealth.time.toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "—",
    avgLatencyMs: avg != null ? `${avg} ms` : "—",
    failedRequests: failed,
    apiHost: host,
    modelEngine,
  };
}
