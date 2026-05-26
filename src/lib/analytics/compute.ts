import { readFile } from "node:fs/promises";
import path from "node:path";

import Papa from "papaparse";

import { mapCsvRecord } from "@/lib/csv/mapper";
import { loadProcessedDataset } from "@/lib/data/processed-cache";
import { SEQUENCE_LENGTH } from "@/lib/features/constants";
import type { CsvRow } from "@/lib/types/maintenance";

import { computeDatasetAnalytics } from "./dataset-stats";
import { computeProcessedTensorSummary } from "./processed-stats";
import type { DatasetAnalytics } from "./types";

export { FEATURE_SCHEMA } from "./feature-schema";

export async function loadCsvRows(): Promise<{ rows: CsvRow[]; rawRowCount: number }> {
  const filePath = path.join(process.cwd(), "data", "pred_maint.csv");
  const content = await readFile(filePath, "utf-8");
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });
  const rawRowCount = parsed.data.length;
  const rows = parsed.data.map(mapCsvRecord).filter((r): r is CsvRow => r !== null);
  return { rows, rawRowCount };
}

export async function computeFullAnalytics(): Promise<DatasetAnalytics> {
  const [{ rows, rawRowCount }, processed] = await Promise.all([
    loadCsvRows(),
    loadProcessedDataset(),
  ]);

  const dataset = computeDatasetAnalytics(rows, rawRowCount, SEQUENCE_LENGTH);
  const processedSummary = computeProcessedTensorSummary(processed);

  return {
    ...dataset,
    processed: processedSummary,
  };
}
