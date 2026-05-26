import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import type { FeatureVector } from "@/lib/types/maintenance";

const MAGIC = Buffer.from("PMX1");
const execFileAsync = promisify(execFile);

export type ProcessedDataset = {
  n: number;
  features: number;
  x: FeatureVector[];
  y: (0 | 1)[];
};

const CACHE_PATH = path.join(process.cwd(), "data", ".cache", "processed.bin");
const BUILD_SCRIPT = path.join(process.cwd(), "scripts", "build-processed-cache.py");

async function ensureCacheBuilt(): Promise<void> {
  if (existsSync(CACHE_PATH)) return;

  if (!existsSync(BUILD_SCRIPT)) {
    throw new Error("Processed cache missing and build script not found");
  }

  const { stdout, stderr } = await execFileAsync("python3", [BUILD_SCRIPT], {
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024,
  });

  if (stderr?.trim()) {
    console.warn("[processed-cache]", stderr.trim());
  }
  if (stdout?.trim()) {
    console.log("[processed-cache]", stdout.trim());
  }

  if (!existsSync(CACHE_PATH)) {
    throw new Error("Failed to build processed cache from .npy files");
  }
}

function parseCacheBuffer(buf: Buffer): ProcessedDataset {
  if (buf.length < 12 || !buf.subarray(0, 4).equals(MAGIC)) {
    throw new Error("Invalid processed cache format");
  }

  const n = buf.readUInt32LE(4);
  const features = buf.readUInt32LE(8);
  if (features !== 7) {
    throw new Error(`Expected 7 features, got ${features}`);
  }

  const xBytes = n * features * 4;
  const yBytes = n;
  const expected = 12 + xBytes + yBytes;
  if (buf.length < expected) {
    throw new Error(`Cache truncated: expected ${expected} bytes, got ${buf.length}`);
  }

  const xFlat = new Float32Array(
    buf.buffer.slice(buf.byteOffset + 12, buf.byteOffset + 12 + xBytes),
  );
  const yRaw = buf.subarray(12 + xBytes, 12 + xBytes + yBytes);

  const x: FeatureVector[] = new Array(n);
  for (let i = 0; i < n; i += 1) {
    const o = i * features;
    x[i] = [
      xFlat[o]!,
      xFlat[o + 1]!,
      xFlat[o + 2]!,
      xFlat[o + 3]!,
      xFlat[o + 4]!,
      xFlat[o + 5]!,
      xFlat[o + 6]!,
    ];
  }

  const y = Array.from(yRaw, (v) => (v >= 1 ? 1 : 0) as 0 | 1);

  return { n, features, x, y };
}

let cached: ProcessedDataset | null = null;

export async function loadProcessedDataset(): Promise<ProcessedDataset> {
  if (cached) return cached;

  await ensureCacheBuilt();
  const buf = await readFile(CACHE_PATH);
  cached = parseCacheBuffer(buf);
  return cached;
}
