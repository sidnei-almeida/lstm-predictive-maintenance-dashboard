import { readFile } from "fs/promises";
import path from "path";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "pred_maint.csv");
    const content = await readFile(filePath, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read dataset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
