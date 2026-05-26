import { NextResponse } from "next/server";

import { loadProcessedDataset } from "@/lib/data/processed-cache";

export async function GET() {
  try {
    const dataset = await loadProcessedDataset();
    return NextResponse.json(dataset, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load processed dataset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
