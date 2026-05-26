import type { ApiPredictPayload, FeatureVector } from "@/lib/types/maintenance";

import { DEFAULT_PRED_MAINT_API_URL } from "./constants";
import { isInferenceDebugEnabled } from "./debug-inference";

export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PRED_MAINT_API_URL ?? DEFAULT_PRED_MAINT_API_URL
  ).replace(/\/$/, "");
}

export type ApiMetadata = {
  project?: string;
  description?: string;
  version?: string;
  features?: string[];
  sequence_length?: number;
  default_threshold?: number;
  threshold?: number;
  dataset?: {
    samples?: number;
    failure_rate?: number;
    source?: string;
  };
  training?: {
    parameters?: {
      epochs?: number;
      batch_size?: number;
      sequence_length?: number;
    };
    evaluation?: {
      test_accuracy?: number;
      test_loss?: number;
    };
    architecture?: string;
  };
};

export async function fetchMetadata(): Promise<ApiMetadata> {
  const url = `${getApiBaseUrl()}/metadata`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Metadata failed: ${res.status}`);
  return res.json() as Promise<ApiMetadata>;
}

export async function fetchHealth(): Promise<{
  model_loaded: boolean;
  data_loaded: boolean;
  training_loaded: boolean;
  tensorflow_available: boolean;
}> {
  const url = `${getApiBaseUrl()}/health`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
    return res.json();
  } catch (error) {
    const hint =
      " Verifique NEXT_PUBLIC_PRED_MAINT_API_URL (padrão: Hugging Face salmeida-predictive-maintenance-lstm).";
    const message = error instanceof Error ? error.message : "Network error";
    throw new Error(`${message} — ${url}.${hint}`);
  }
}

export async function predictSequence(sequence: FeatureVector[]): Promise<{
  data: ApiPredictPayload;
  latencyMs: number;
}> {
  const started = performance.now();
  const res = await fetch(`${getApiBaseUrl()}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sequence }),
  });
  const latencyMs = Math.round(performance.now() - started);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Predict failed: ${res.status}`);
  }

  const data = (await res.json()) as ApiPredictPayload;

  if (isInferenceDebugEnabled()) {
    console.log("[PM Inference] POST /predict raw response:", data);
    console.log("[PM Inference] sequence length:", sequence.length);
    if (sequence.length > 0) {
      console.log("[PM Inference] first vector:", sequence[0]);
      console.log("[PM Inference] last vector:", sequence[sequence.length - 1]);
    }
  }

  return { data, latencyMs };
}
