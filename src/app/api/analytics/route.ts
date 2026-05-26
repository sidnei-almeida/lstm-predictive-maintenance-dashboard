import { NextResponse } from "next/server";

import { computeFullAnalytics } from "@/lib/analytics/compute";

export async function GET() {
  try {
    const analytics = await computeFullAnalytics();
    return NextResponse.json(analytics, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analytics computation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
