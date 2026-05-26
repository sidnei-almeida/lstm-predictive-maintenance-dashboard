import type { CsvRow } from "@/lib/types/maintenance";

import type {
  CountItem,
  DataQualityReport,
  DatasetAnalytics,
  RiskFactorCard,
  SensorComparison,
  SensorStat,
  ToolWearBin,
  TorqueSpeedBucket,
  TorqueSpeedPoint,
} from "./types";

const SENSOR_DEFS = [
  { key: "air", label: "Air temperature", field: "airTemperatureK" as const, unit: "K" },
  { key: "process", label: "Process temperature", field: "processTemperatureK" as const, unit: "K" },
  { key: "speed", label: "Rotational speed", field: "rotationalSpeedRpm" as const, unit: "rpm" },
  { key: "torque", label: "Torque", field: "torqueNm" as const, unit: "Nm" },
  { key: "wear", label: "Tool wear", field: "toolWearMin" as const, unit: "min" },
] as const;

const HIGH_TOOL_WEAR = 200;
const HIGH_TORQUE = 55;
const WEAR_BIN_SIZE = 25;

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const v = values.reduce((s, x) => s + (x - avg) ** 2, 0) / values.length;
  return Math.sqrt(v);
}

function round(n: number, d = 2): number {
  const p = 10 ** d;
  return Math.round(n * p) / p;
}

function pct(n: number, total: number): number {
  return total > 0 ? round((n / total) * 100, 2) : 0;
}

function computeSensorStats(rows: CsvRow[]): SensorStat[] {
  return SENSOR_DEFS.map(({ key, label, field, unit }) => {
    const values = rows.map((r) => r[field]);
    const avg = mean(values);
    return {
      key,
      label,
      unit,
      min: round(Math.min(...values)),
      mean: round(avg),
      max: round(Math.max(...values)),
      std: round(std(values, avg)),
    };
  });
}

function computeSensorComparison(rows: CsvRow[]): SensorComparison[] {
  const normal = rows.filter((r) => r.machineFailure === 0);
  const failure = rows.filter((r) => r.machineFailure === 1);

  return SENSOR_DEFS.map(({ label, field, unit }) => ({
    feature: label,
    normalMean: round(mean(normal.map((r) => r[field]))),
    failureMean: round(mean(failure.map((r) => r[field]))),
    unit,
  }));
}

function computeTemperatureGap(rows: CsvRow[]) {
  const gaps = rows.map((r) => r.processTemperatureK - r.airTemperatureK);
  const normalGaps = rows.filter((r) => r.machineFailure === 0).map((r) => r.processTemperatureK - r.airTemperatureK);
  const failureGaps = rows.filter((r) => r.machineFailure === 1).map((r) => r.processTemperatureK - r.airTemperatureK);
  const sorted = [...gaps].sort((a, b) => a - b);
  const highGapThreshold = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
  const highGapRows = rows.filter(
    (r) => r.processTemperatureK - r.airTemperatureK >= highGapThreshold,
  );

  return {
    normalMean: round(mean(normalGaps)),
    failureMean: round(mean(failureGaps)),
    normalMin: round(Math.min(...normalGaps)),
    normalMax: round(Math.max(...normalGaps)),
    failureMin: round(Math.min(...failureGaps)),
    failureMax: round(Math.max(...failureGaps)),
    highGapThreshold: round(highGapThreshold),
    highGapCount: highGapRows.length,
    hdfAmongHighGap: highGapRows.filter((r) => r.hdf === 1).length,
  };
}

function computeToolWearBins(rows: CsvRow[]): ToolWearBin[] {
  const maxWear = Math.max(...rows.map((r) => r.toolWearMin));
  const bins: ToolWearBin[] = [];

  for (let start = 0; start <= maxWear; start += WEAR_BIN_SIZE) {
    const end = start + WEAR_BIN_SIZE - 1;
    const inBin = rows.filter((r) => r.toolWearMin >= start && r.toolWearMin <= end);
    if (inBin.length === 0 && start > maxWear) break;
    const failures = inBin.filter((r) => r.machineFailure === 1).length;
    bins.push({
      range: `${start}–${end}`,
      count: inBin.length,
      failureCount: failures,
      failureRate: pct(failures, inBin.length),
    });
  }

  return bins.filter((b) => b.count > 0);
}

function subsampleScatter(rows: CsvRow[], maxPoints = 600): TorqueSpeedPoint[] {
  if (rows.length <= maxPoints) {
    return rows.map((r) => ({
      speed: r.rotationalSpeedRpm,
      torque: r.torqueNm,
      failure: r.machineFailure,
    }));
  }
  const step = Math.ceil(rows.length / maxPoints);
  return rows
    .filter((_, i) => i % step === 0)
    .map((r) => ({
      speed: r.rotationalSpeedRpm,
      torque: r.torqueNm,
      failure: r.machineFailure,
    }));
}

function computeTorqueSpeedBuckets(rows: CsvRow[]): TorqueSpeedBucket[] {
  const speeds = rows.map((r) => r.rotationalSpeedRpm);
  const minS = Math.min(...speeds);
  const maxS = Math.max(...speeds);
  const binCount = 8;
  const width = (maxS - minS) / binCount || 1;
  const buckets: TorqueSpeedBucket[] = [];

  for (let i = 0; i < binCount; i += 1) {
    const lo = minS + i * width;
    const hi = lo + width;
    const inBin = rows.filter((r) => r.rotationalSpeedRpm >= lo && (i === binCount - 1 ? r.rotationalSpeedRpm <= hi : r.rotationalSpeedRpm < hi));
    const failures = inBin.filter((r) => r.machineFailure === 1).length;
    buckets.push({
      speedBin: `${Math.round(lo)}–${Math.round(hi)}`,
      torqueMean: round(mean(inBin.map((r) => r.torqueNm))),
      count: inBin.length,
      failureRate: pct(failures, inBin.length),
    });
  }

  return buckets;
}

function computeRiskFactors(rows: CsvRow[]): RiskFactorCard[] {
  const failures = rows.filter((r) => r.machineFailure === 1);
  const highWear = rows.filter((r) => r.toolWearMin >= HIGH_TOOL_WEAR);
  const highWearFailures = highWear.filter((r) => r.machineFailure === 1);
  const highTorque = rows.filter((r) => r.torqueNm >= HIGH_TORQUE);
  const highTorqueFailures = highTorque.filter((r) => r.machineFailure === 1);
  const gaps = rows.map((r) => r.processTemperatureK - r.airTemperatureK);
  const gapThreshold = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length * 0.75)] ?? 0;
  const highGap = rows.filter((r) => r.processTemperatureK - r.airTemperatureK >= gapThreshold);
  const overstrain = rows.filter((r) => r.torqueNm >= HIGH_TORQUE && r.toolWearMin >= HIGH_TOOL_WEAR);
  const osfInOverstrain = overstrain.filter((r) => r.osf === 1).length;

  return [
    {
      id: "tool-wear",
      title: "High Tool Wear (EDA)",
      metrics: [
        { label: "Threshold", value: `≥ ${HIGH_TOOL_WEAR} min` },
        { label: "High-wear samples", value: highWear.length.toLocaleString() },
        {
          label: "Failure rate (high wear)",
          value: `${pct(highWearFailures.length, highWear.length)}%`,
        },
        {
          label: "Avg wear in failures",
          value: `${round(mean(failures.map((r) => r.toolWearMin)), 1)} min`,
        },
      ],
      note: "Operational risk indicator — not model feature importance.",
    },
    {
      id: "torque",
      title: "High Torque Load (EDA)",
      metrics: [
        { label: "Threshold", value: `≥ ${HIGH_TORQUE} Nm` },
        { label: "High-torque samples", value: highTorque.length.toLocaleString() },
        {
          label: "Failure rate (high torque)",
          value: `${pct(highTorqueFailures.length, highTorque.length)}%`,
        },
      ],
      note: "Comparative EDA grouping — not SHAP attribution.",
    },
    {
      id: "heat",
      title: "Heat Dissipation Context",
      metrics: [
        { label: "Avg temp gap (all)", value: `${round(mean(gaps), 2)} K` },
        { label: "High-gap threshold (P75)", value: `≥ ${round(gapThreshold, 2)} K` },
        { label: "High-gap samples", value: highGap.length.toLocaleString() },
        { label: "HDF in high-gap group", value: String(highGap.filter((r) => r.hdf === 1).length) },
      ],
      note: "Process − air temperature gap; HDF is failure-mode context only.",
    },
    {
      id: "overstrain",
      title: "Overstrain Context",
      metrics: [
        { label: "High torque + high wear", value: overstrain.length.toLocaleString() },
        { label: "OSF in that group", value: String(osfInOverstrain) },
        {
          label: "OSF rate in group",
          value: `${pct(osfInOverstrain, overstrain.length)}%`,
        },
      ],
      note: "Torque/wear co-occurrence — OSF label for analytics only.",
    },
  ];
}

function computeDataQuality(rows: CsvRow[], rawRowCount: number): DataQualityReport {
  const udiCounts = new Map<number, number>();
  for (const r of rows) {
    udiCounts.set(r.udi, (udiCounts.get(r.udi) ?? 0) + 1);
  }
  const duplicateUdiRows = [...udiCounts.values()].reduce((s, c) => s + (c > 1 ? c - 1 : 0), 0);

  const failureSamples = rows.filter((r) => r.machineFailure === 1).length;
  const normalSamples = rows.length - failureSamples;
  const failureModeOccurrences = rows.reduce(
    (s, r) => s + r.twf + r.hdf + r.pwf + r.osf + r.rnf,
    0,
  );

  const failureWithoutMode = rows.filter(
    (r) => r.machineFailure === 1 && r.twf + r.hdf + r.pwf + r.osf + r.rnf === 0,
  ).length;

  const modeWithoutFailure = rows.filter(
    (r) => r.machineFailure === 0 && r.twf + r.hdf + r.pwf + r.osf + r.rnf > 0,
  ).length;

  return {
    missingValues: Math.max(0, rawRowCount - rows.length),
    duplicateUdiRows,
    classImbalanceRatio: `1 : ${normalSamples > 0 ? round(normalSamples / Math.max(failureSamples, 1), 1) : "—"}`,
    machineFailureCount: failureSamples,
    failureModeOccurrences,
    failureWithoutMode,
    modeWithoutFailure,
  };
}

export function computeDatasetAnalytics(
  rows: CsvRow[],
  rawRowCount: number,
  sequenceLength: number,
): Omit<DatasetAnalytics, "processed"> {
  const total = rows.length;
  const failureSamples = rows.filter((r) => r.machineFailure === 1).length;
  const normalSamples = total - failureSamples;
  const failureRate = total > 0 ? failureSamples / total : 0;

  const typeStats = { L: { total: 0, failures: 0 }, M: { total: 0, failures: 0 }, H: { total: 0, failures: 0 } };
  for (const r of rows) {
    typeStats[r.type].total += 1;
    if (r.machineFailure === 1) typeStats[r.type].failures += 1;
  }

  const failureModeBreakdown: CountItem[] = [
    { name: "TWF", count: rows.filter((r) => r.twf === 1).length },
    { name: "HDF", count: rows.filter((r) => r.hdf === 1).length },
    { name: "PWF", count: rows.filter((r) => r.pwf === 1).length },
    { name: "OSF", count: rows.filter((r) => r.osf === 1).length },
    { name: "RNF", count: rows.filter((r) => r.rnf === 1).length },
  ];

  return {
    totalSamples: total,
    failureSamples,
    normalSamples,
    failureRate,
    sensorFeatureCount: 7,
    sequenceLength,
    modelInputShape: `${sequenceLength} × 7`,

    classDistribution: [
      { name: "Normal", count: normalSamples, rate: pct(normalSamples, total) },
      { name: "Machine Failure", count: failureSamples, rate: pct(failureSamples, total) },
    ],
    failureModeBreakdown,
    productTypeDistribution: (["L", "M", "H"] as const).map((t) => ({
      name: `Type ${t}`,
      count: typeStats[t].total,
      rate: pct(typeStats[t].total, total),
    })),
    failureRateByType: (["L", "M", "H"] as const).map((t) => ({
      name: `Type ${t}`,
      count: typeStats[t].failures,
      rate: pct(typeStats[t].failures, typeStats[t].total),
    })),

    sensorStats: computeSensorStats(rows),
    sensorComparison: computeSensorComparison(rows),
    temperatureGap: computeTemperatureGap(rows),
    toolWearBins: computeToolWearBins(rows),
    torqueSpeedScatter: subsampleScatter(rows),
    torqueSpeedBuckets: computeTorqueSpeedBuckets(rows),
    riskFactors: computeRiskFactors(rows),
    dataQuality: computeDataQuality(rows, rawRowCount),
  };
}
