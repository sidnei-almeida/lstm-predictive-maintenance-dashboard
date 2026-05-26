export type ProductType = "L" | "M" | "H";

export type StreamStatus = "idle" | "live" | "paused";

export type HealthBand = "healthy" | "watch" | "maintenance_risk" | "awaiting";

export type RiskBand = "low" | "medium" | "high" | "—";

export type PredictionLabel = "Healthy" | "Watch" | "Maintenance Risk" | "—";

export type SequencePhase = "building" | "ready" | "inference_active" | "idle";

export type FailureModeKey = "TWF" | "HDF" | "PWF" | "OSF" | "RNF";

export type CsvRow = {
  udi: number;
  productId: string;
  type: ProductType;
  airTemperatureK: number;
  processTemperatureK: number;
  rotationalSpeedRpm: number;
  torqueNm: number;
  toolWearMin: number;
  machineFailure: 0 | 1;
  twf: 0 | 1;
  hdf: 0 | 1;
  pwf: 0 | 1;
  osf: 0 | 1;
  rnf: 0 | 1;
};

export type FeatureVector = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export type ScalerStats = {
  mean: [number, number, number, number, number];
  std: [number, number, number, number, number];
};

export type MachinePacket = {
  packetId: number;
  /** CSV / processed tensor row index */
  rowIndex?: number;
  udi: number;
  productId: string;
  productType: ProductType;
  timestamp: Date;
  sensors: {
    air_temperature_k: number;
    process_temperature_k: number;
    rotational_speed_rpm: number;
    torque_nm: number;
    tool_wear_min: number;
    type_l: 0 | 1;
    type_m: 0 | 1;
  };
  groundTruth: {
    machineFailure: 0 | 1;
    failureModes: FailureModeKey[];
  };
  /** Model-ready vector from X_processed.npy (index-aligned with CSV row) */
  modelVector: FeatureVector;
};

/** Raw API response shape — fields vary between /sample and /predict */
export type ApiPredictPayload = {
  probability?: number;
  predicted_probability?: number;
  prediction_probability?: number;
  predicted_label?: number;
  threshold?: number;
  label?: number;
  details?: {
    sequence_steps?: number;
    features_order?: string[];
    uses_simulated_model?: boolean;
    reading?: Record<string, unknown>;
  };
};

export type InferenceSnapshot = {
  rawProbability: number;
  displayProbability: number;
  predictedLabel: 0 | 1;
  thresholdRaw: number;
  thresholdDisplay: number;
  groundTruthLabel: "Normal" | "Failure" | "Unknown";
  status: PredictionLabel;
  apiFieldUsed: string;
  usesSimulatedModel: boolean;
  latencyMs: number;
  health: HealthBand;
  riskBand: RiskBand;
  /** @deprecated use status */
  prediction: PredictionLabel;
  /** @deprecated use rawProbability */
  probability: number;
  /** @deprecated use displayProbability */
  probabilityDisplay: number;
  /** @deprecated use thresholdRaw */
  threshold: number;
};

export type ChartPoint = {
  timestamp: number;
  packetId: number;
  probabilityDisplay: number;
  thresholdDisplay: number;
  status: PredictionLabel;
  groundTruth: "Normal" | "Failure" | "Unknown";
  productType: ProductType;
  toolWear: number;
  /** Known failure row in curated/sequential replay (ground truth only). */
  knownFailure?: boolean;
};

export type {
  MaintenanceEvent,
  MaintenanceEvent as EventLogEntry,
} from "@/lib/events/types";

export type RiskDriverRow = {
  label: string;
  level: "Low" | "Moderate" | "High" | "—";
  detail: string;
  /** Normalized stress 0–1 for segmented bar fill */
  score?: number;
};
