import type { CsvRow } from "@/lib/types/maintenance";

import { classifyEventType, classifyStatusKind } from "./classify";
import type {
  EventSource,
  MaintenanceEvent,
  SensorSnapshot,
  SequenceRange,
} from "./types";

export function failureModesFromRow(row: Pick<CsvRow, "twf" | "hdf" | "pwf" | "osf" | "rnf">): string {
  const modes: string[] = [];
  if (row.twf) modes.push("TWF");
  if (row.hdf) modes.push("HDF");
  if (row.pwf) modes.push("PWF");
  if (row.osf) modes.push("OSF");
  if (row.rnf) modes.push("RNF");
  return modes.length > 0 ? modes.join(", ") : "—";
}

export function sensorSnapshotFromRow(row: CsvRow): SensorSnapshot {
  return {
    airTemperatureK: row.airTemperatureK,
    processTemperatureK: row.processTemperatureK,
    rotationalSpeedRpm: row.rotationalSpeedRpm,
    torqueNm: row.torqueNm,
    toolWearMin: row.toolWearMin,
  };
}

export type EventPartial = Omit<
  MaintenanceEvent,
  "id" | "time" | "eventType" | "statusKind" | "failureModes"
> & {
  id?: string;
  time?: Date;
  eventType?: MaintenanceEvent["eventType"];
  statusKind?: MaintenanceEvent["statusKind"];
  failureModes?: string;
};

export function buildMaintenanceEvent(
  partial: EventPartial,
  row?: CsvRow | null,
): MaintenanceEvent {
  const eventType = partial.eventType ?? classifyEventType(partial.event, partial.source);
  const statusKind = partial.statusKind ?? classifyStatusKind(partial.status, partial.event);

  return {
    id: partial.id ?? "",
    time: partial.time ?? new Date(),
    packet: partial.packet,
    packetId: partial.packetId,
    rowIndex: partial.rowIndex,
    eventType,
    event: partial.event,
    status: partial.status,
    statusKind,
    probability: partial.probability,
    rawProbability: partial.rawProbability,
    displayProbability: partial.displayProbability,
    threshold: partial.threshold,
    thresholdRaw: partial.thresholdRaw,
    predictedLabel: partial.predictedLabel,
    groundTruth: partial.groundTruth,
    failureModes: partial.failureModes ?? (row ? failureModesFromRow(row) : "—"),
    source: partial.source,
    conditionDriver: partial.conditionDriver,
    action: partial.action,
    latencyMs: partial.latencyMs,
    usesSimulatedModel: partial.usesSimulatedModel,
    productId: partial.productId ?? row?.productId,
    productType: partial.productType ?? row?.type,
    sensorSnapshot: partial.sensorSnapshot ?? (row ? sensorSnapshotFromRow(row) : undefined),
    sequenceRange: partial.sequenceRange,
  };
}

export function appendMaintenanceEvent(
  events: MaintenanceEvent[],
  partial: EventPartial,
  row?: CsvRow | null,
  maxEvents = 5000,
): MaintenanceEvent[] {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const entry = buildMaintenanceEvent({ ...partial, id }, row);
  return [entry, ...events].slice(0, maxEvents);
}

export function sequenceRangeFromBuffer(
  rowIndices: (number | undefined)[],
): SequenceRange | undefined {
  const indices = rowIndices.filter((i): i is number => i != null);
  if (indices.length === 0) return undefined;
  return {
    start: Math.min(...indices),
    end: Math.max(...indices),
    length: indices.length,
  };
}

export function mapSourceToFilter(source: EventSource): string {
  return source;
}
