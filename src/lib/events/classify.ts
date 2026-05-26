import type { EventCategory, EventStatusKind } from "./types";

export function classifyEventType(event: string, source: string): EventCategory {
  const e = event.toLowerCase();
  if (source === "User" || e.includes("inject")) return "user";
  if (source === "LSTM API" || e.includes("prediction") || e.includes("inference")) return "prediction";
  if (
    e.includes("maintenance risk") ||
    e.includes("warning threshold") ||
    e.includes("failure risk")
  ) {
    return "alert";
  }
  if (e.includes("api") || e.includes("health") || e.includes("metadata")) return "api";
  if (e.includes("dataset") || e.includes("processed model")) return "dataset";
  if (e.includes("stream") || e.includes("csv") || e.includes("sequence") || e.includes("replay")) {
    return "stream";
  }
  return "stream";
}

export function classifyStatusKind(status: string, event: string): EventStatusKind {
  const s = status.toLowerCase();
  const e = event.toLowerCase();
  if (s.includes("maintenance risk") || s === "maintenance risk") return "risk";
  if (s.includes("watch")) return "watch";
  if (s.includes("healthy")) return "healthy";
  if (s.includes("error") || e.includes("failed")) return "error";
  if (s.includes("ground truth")) return "ground_truth";
  if (s.includes("replay")) return "replay";
  if (s.includes("ready") || s.includes("online")) return "ready";
  if (s.includes("packet")) return "packet";
  if (s === "system" || s.includes("idle") || s.includes("paused") || s.includes("live")) {
    return "system";
  }
  if (e.includes("api") || e.includes("lstm inference api")) return "api";
  return "unknown";
}
