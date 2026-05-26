/**
 * Processed tensor access for analytics and inference.
 * Binary cache is built from X_processed.npy / y_processed.npy via scripts/build-processed-cache.py.
 */
export { loadProcessedDataset, type ProcessedDataset } from "@/lib/data/processed-cache";
