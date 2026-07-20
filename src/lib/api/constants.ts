/**
 * Inference API base URL.
 *
 * The LSTM now runs in-process as Next.js route handlers (src/app/api/*), so
 * the default is this app's own /api prefix — no external service, no cold
 * start. Set NEXT_PUBLIC_PRED_MAINT_API_URL only to point the dashboard at a
 * different backend.
 */
export const DEFAULT_PRED_MAINT_API_URL = "/api";
