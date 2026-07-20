import { NextResponse } from "next/server";

import { loadModelMetrics } from "@/lib/metrics/load";
import { DECISION_THRESHOLD, FEATURE_NAMES } from "@/lib/model/predict";
import { SEQUENCE_LENGTH } from "@/lib/model/lstm";

/** Model card for the analytics page — mirrors the previous FastAPI /metadata. */
export async function GET() {
  try {
    const { dashboard, training } = await loadModelMetrics();
    const { dataset_info: dataset } = training;

    return NextResponse.json(
      {
        project: "Predictive Maintenance LSTM API",
        description:
          "In-process LSTM inference serving failure predictions for the maintenance dashboard.",
        version: "2.0.0",
        features: FEATURE_NAMES,
        sequence_length: SEQUENCE_LENGTH,
        default_threshold: DECISION_THRESHOLD,
        threshold: dashboard.decision_threshold,
        dataset: {
          samples: dataset.training_samples + dataset.testing_samples,
          failure_rate: dashboard.dataset_context.failure_rate,
          source: "Bundled with the dashboard (data/X_processed.npy)",
        },
        training: {
          parameters: training.training_parameters,
          evaluation: training.final_evaluation,
          architecture: training.model_architecture,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load model metadata";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
