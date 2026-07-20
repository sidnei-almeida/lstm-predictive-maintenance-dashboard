/**
 * Inference API base URL.
 *
 * The LSTM now runs in-process as Next.js route handlers (src/app/api/*), so
 * the default is this app's own /api prefix — no external service, no cold
 * start. Set NEXT_PUBLIC_PRED_MAINT_API_URL only to point the dashboard at a
 * different backend.
 */
export const DEFAULT_PRED_MAINT_API_URL = "/api";

/**
 * The Hugging Face Space that used to serve inference. Deployments may still
 * carry it in NEXT_PUBLIC_PRED_MAINT_API_URL; getApiBaseUrl() ignores it.
 */
export const RETIRED_INFERENCE_HOST = "salmeida-predictive-maintenance-lstm.hf.space";
