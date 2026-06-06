import { NextResponse } from "next/server";

import { loadModelMetrics } from "@/lib/metrics/load";

export async function GET() {
  try {
    const metrics = await loadModelMetrics();
    return NextResponse.json(metrics, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load model metrics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
