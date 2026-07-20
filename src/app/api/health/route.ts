import { NextResponse } from "next/server";

import { predictFromSequence } from "@/lib/model/predict";
import { FEATURE_COUNT, SEQUENCE_LENGTH } from "@/lib/model/lstm";

/**
 * Readiness probe. Runs one real inference so a broken weights bundle surfaces
 * here instead of on the first user request.
 *
 * `tensorflow_available` is retained for backwards compatibility with the
 * previous Python service; inference now runs in-process in TypeScript.
 */
export async function GET() {
  try {
    const probe = Array.from({ length: SEQUENCE_LENGTH }, () =>
      Array.from({ length: FEATURE_COUNT }, () => 0),
    );
    const result = predictFromSequence(probe);

    return NextResponse.json(
      {
        model_loaded: Number.isFinite(result.probability),
        data_loaded: true,
        training_loaded: true,
        tensorflow_available: false,
        runtime: "typescript",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      {
        model_loaded: false,
        data_loaded: false,
        training_loaded: false,
        tensorflow_available: false,
        runtime: "typescript",
      },
      { status: 500 },
    );
  }
}
