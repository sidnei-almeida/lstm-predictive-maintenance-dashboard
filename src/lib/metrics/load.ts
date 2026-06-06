import { readFile } from "node:fs/promises";
import path from "node:path";

import type {
  DashboardMetrics,
  ModelMetricsBundle,
  ThresholdPoint,
  TrainingSummary,
} from "./types";

const METRICS_DIR = path.join(process.cwd(), "metrics");

export async function loadModelMetrics(): Promise<ModelMetricsBundle> {
  const [dashboardRaw, trainingRaw, thresholdRaw] = await Promise.all([
    readFile(path.join(METRICS_DIR, "dashboard_metrics.json"), "utf-8"),
    readFile(path.join(METRICS_DIR, "training_summary.json"), "utf-8"),
    readFile(path.join(METRICS_DIR, "threshold_analysis.json"), "utf-8"),
  ]);

  return {
    dashboard: JSON.parse(dashboardRaw) as DashboardMetrics,
    training: JSON.parse(trainingRaw) as TrainingSummary,
    thresholdAnalysis: JSON.parse(thresholdRaw) as ThresholdPoint[],
  };
}
