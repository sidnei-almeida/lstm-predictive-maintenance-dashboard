import { NextResponse } from "next/server";

import { InvalidSequenceError, predictFromSequence } from "@/lib/model/predict";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Request body must be valid JSON." }, { status: 400 });
  }

  const sequence = (body as { sequence?: unknown } | null)?.sequence;

  try {
    const result = predictFromSequence(sequence);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof InvalidSequenceError) {
      return NextResponse.json({ detail: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Inference failed";
    console.error("Inference error:", error);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
