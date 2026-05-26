import type { ProductType } from "@/lib/types/maintenance";

export type CountItem = { name: string; count: number; rate?: number };

export type SensorStat = {
  key: string;
  label: string;
  unit: string;
  min: number;
  mean: number;
  max: number;
  std: number;
};

export type SensorComparison = {
  feature: string;
  normalMean: number;
  failureMean: number;
  unit: string;
};

export type ToolWearBin = {
  range: string;
  count: number;
  failureCount: number;
  failureRate: number;
};

export type TorqueSpeedPoint = {
  speed: number;
  torque: number;
  failure: 0 | 1;
};

export type TorqueSpeedBucket = {
  speedBin: string;
  torqueMean: number;
  count: number;
  failureRate: number;
};

export type RiskFactorCard = {
  id: string;
  title: string;
  metrics: { label: string; value: string }[];
  note: string;
};

export type FeatureSchemaRow = {
  apiName: string;
  sourceColumn: string;
  unit: string;
  preprocessing: string;
};

export type DataQualityReport = {
  missingValues: number;
  duplicateUdiRows: number;
  classImbalanceRatio: string;
  machineFailureCount: number;
  failureModeOccurrences: number;
  failureWithoutMode: number;
  modeWithoutFailure: number;
};

export type ProcessedTensorSummary = {
  xShape: string;
  yShape: string;
  featureCount: number;
  sequenceLength: number | null;
  layout: "[N, 7] per timestep" | "[N, 50, 7] full sequences";
  valueMin: number;
  valueMax: number;
  valueMean: number;
  valueStd: number;
  labelOnes: number;
  labelZeros: number;
};

export type DatasetAnalytics = {
  totalSamples: number;
  failureSamples: number;
  normalSamples: number;
  failureRate: number;
  sensorFeatureCount: number;
  sequenceLength: number;
  modelInputShape: string;

  classDistribution: CountItem[];
  failureModeBreakdown: CountItem[];
  productTypeDistribution: CountItem[];
  failureRateByType: CountItem[];

  sensorStats: SensorStat[];
  sensorComparison: SensorComparison[];
  temperatureGap: {
    normalMean: number;
    failureMean: number;
    normalMin: number;
    normalMax: number;
    failureMin: number;
    failureMax: number;
    highGapThreshold: number;
    highGapCount: number;
    hdfAmongHighGap: number;
  };

  toolWearBins: ToolWearBin[];
  torqueSpeedScatter: TorqueSpeedPoint[];
  torqueSpeedBuckets: TorqueSpeedBucket[];

  riskFactors: RiskFactorCard[];
  dataQuality: DataQualityReport;
  processed: ProcessedTensorSummary;
};

export type ProductTypeStats = Record<ProductType, { total: number; failures: number }>;
