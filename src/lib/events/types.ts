import type { ProductType } from "@/lib/types/maintenance";

export type EventCategory = "stream" | "prediction" | "alert" | "dataset" | "api" | "user";

export type EventStatusKind =
  | "healthy"
  | "watch"
  | "risk"
  | "system"
  | "api"
  | "packet"
  | "error"
  | "replay"
  | "ground_truth"
  | "ready"
  | "unknown";

export type EventSource = "CSV Replay" | "LSTM API" | "System" | "User";

export type SensorSnapshot = {
  airTemperatureK: number;
  processTemperatureK: number;
  rotationalSpeedRpm: number;
  torqueNm: number;
  toolWearMin: number;
};

export type SequenceRange = {
  start: number;
  end: number;
  length: number;
};

/** Full maintenance event — shared by dashboard log and Alerts / History */
export type MaintenanceEvent = {
  id: string;
  time: Date;
  packet: string;
  packetId?: number;
  rowIndex?: number;
  eventType: EventCategory;
  event: string;
  status: string;
  statusKind: EventStatusKind;
  probability: string;
  rawProbability?: number;
  displayProbability?: number;
  threshold: string;
  thresholdRaw?: number;
  predictedLabel?: 0 | 1;
  groundTruth: string;
  failureModes: string;
  source: EventSource;
  conditionDriver: string;
  action: string;
  latencyMs?: number;
  usesSimulatedModel?: boolean;
  productId?: string;
  productType?: ProductType;
  sensorSnapshot?: SensorSnapshot;
  sequenceRange?: SequenceRange;
};

/** @deprecated alias */
export type EventLogEntry = MaintenanceEvent;

export type EventFilters = {
  search: string;
  prediction: string;
  groundTruth: string;
  failureMode: string;
  eventType: string;
  minProbability: string;
};

export const DEFAULT_EVENT_FILTERS: EventFilters = {
  search: "",
  prediction: "all",
  groundTruth: "all",
  failureMode: "all",
  eventType: "all",
  minProbability: "all",
};
