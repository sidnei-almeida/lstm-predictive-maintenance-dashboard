"use client";

import { useState } from "react";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deriveModelPrediction, displayEventType } from "@/lib/events";
import {
  actionTextClass,
  eventTypeBadgeClass,
  groundTruthPillClass,
  parseDisplayPercent,
  predictionStatusClass,
  probabilityTextClass,
} from "@/lib/theme/tokens";
import { cn } from "@/lib/utils";
import { useMaintenanceStore } from "@/store/maintenance-store";

const COLUMNS = [
  "Time",
  "Packet",
  "Type",
  "Event",
  "Prediction",
  "Prob",
  "Thr",
  "GT",
  "Source",
  "Action",
] as const;

function eventSeverityBorder(eventType: string): string {
  const upper = eventType.toUpperCase();
  if (upper.includes("FAIL") || upper.includes("CRIT") || upper.includes("ERROR")) {
    return "border-l-[#ff0000]";
  }
  if (upper.includes("WARN") || upper.includes("RISK")) {
    return "border-l-[#ffaa00]";
  }
  return "border-l-[#00ff00]";
}

export function EventLog() {
  const events = useMaintenanceStore((s) => s.events);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const visibleEvents = events.slice(0, visibleCount);

  return (
    <DashboardPanel
      title="Recent Event Log"
      description="System diagnostic log"
      className="min-h-[200px]"
      bodyClassName="p-0"
    >
      <div className="countach-event-table max-h-[320px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="countach-table-head-row hover:bg-transparent">
              {COLUMNS.map((col) => (
                <TableHead
                  key={col}
                  className="countach-table-head table-head sticky top-0 z-10"
                >
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length}
                  className="h-16 text-center retro-meta"
                >
                  No events — start stream
                </TableCell>
              </TableRow>
            ) : (
              events.slice(0, 80).map((entry, idx) => {
                const eventType = displayEventType(entry);
                const pred = deriveModelPrediction(entry);
                const probPct = parseDisplayPercent(entry.probability);
                const gt = entry.groundTruth?.trim() || "—";

                return (
                  <TableRow
                    key={entry.id}
                    className={cn(
                      "countach-table-row retro-table-row font-mono text-[9px]",
                      idx % 2 === 1 && "countach-table-row--alt",
                    )}
                  >
                    <TableCell className="whitespace-nowrap tabular-nums retro-txt-secondary">
                      {entry.time.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="tabular-nums retro-txt-primary">{entry.packet}</TableCell>
                    <TableCell>
                      <span className={eventTypeBadgeClass(eventType)}>{eventType}</span>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate retro-txt-secondary">
                      {entry.event}
                    </TableCell>
                    <TableCell>
                      {pred === "—" ? (
                        <span className="retro-txt-muted">—</span>
                      ) : (
                        <span className={predictionStatusClass(pred)}>{pred}</span>
                      )}
                    </TableCell>
                    <TableCell className={cn("tabular-nums", probabilityTextClass(probPct))}>
                      {entry.probability}
                    </TableCell>
                    <TableCell className="tabular-nums retro-txt-muted">{entry.threshold}</TableCell>
                    <TableCell>
                      {gt === "—" ? (
                        <span className="retro-txt-muted">—</span>
                      ) : (
                        <span className={groundTruthPillClass(gt)}>{gt}</span>
                      )}
                    </TableCell>
                    <TableCell className="retro-txt-muted">{entry.source}</TableCell>
                    <TableCell className={cn("max-w-[160px] truncate", actionTextClass(entry.action))}>
                      {entry.action}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="countach-event-cards flex flex-col gap-2 p-3">
        {events.length === 0 ? (
          <p className="py-8 text-center font-mono text-[10px] uppercase tracking-wide text-[#666666]">
            No events — start stream
          </p>
        ) : (
          <>
            {visibleEvents.map((entry) => {
              const eventType = displayEventType(entry);
              const pred = deriveModelPrediction(entry);
              const probPct = parseDisplayPercent(entry.probability);
              const gt = entry.groundTruth?.trim() || "—";
              const expanded = expandedId === entry.id;
              const timeLabel = entry.time.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <article
                  key={entry.id}
                  className={cn(
                    "countach-event-card overflow-hidden border border-[#222222] border-l-4 bg-[#0a0a0a]",
                    eventSeverityBorder(eventType),
                    expanded && "countach-event-card--expanded",
                  )}
                >
                  <button
                    type="button"
                    className="countach-event-card__header flex w-full min-h-11 items-center justify-between gap-2 p-3 text-left"
                    aria-expanded={expanded}
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                  >
                    <span className="font-mono text-[10px] tabular-nums text-[#888888]">
                      {timeLabel}
                    </span>
                    <span className={eventTypeBadgeClass(eventType)}>{eventType}</span>
                  </button>
                  <p className="countach-event-card__type px-3 pb-2 font-mono text-[11px] font-bold text-[#ffffff]">
                    {entry.event}
                  </p>
                  <div className="countach-event-card__body">
                    <dl className="space-y-2 px-3 pb-3 font-mono text-[10px]">
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#666666]">Packet</dt>
                        <dd className="tabular-nums text-[#ffffff]">{entry.packet}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#666666]">Prediction</dt>
                        <dd>
                          {pred === "—" ? (
                            <span className="text-[#666666]">—</span>
                          ) : (
                            <span className={predictionStatusClass(pred)}>{pred}</span>
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#666666]">Prob / Thr</dt>
                        <dd className={cn("tabular-nums", probabilityTextClass(probPct))}>
                          {entry.probability} / {entry.threshold}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-[#666666]">GT / Source</dt>
                        <dd className="text-right text-[#888888]">
                          {gt === "—" ? "—" : gt} · {entry.source}
                        </dd>
                      </div>
                      <div className="border-t border-[#222222] pt-2">
                        <p className={cn("text-[10px] leading-snug", actionTextClass(entry.action))}>
                          {entry.action}
                        </p>
                      </div>
                    </dl>
                  </div>
                </article>
              );
            })}

            {visibleCount < events.length ? (
              <button
                type="button"
                className="countach-event-load-more min-h-11 w-full border border-[#333333] bg-[#0a0a0a] px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#ffaa00]"
                onClick={() => setVisibleCount((n) => n + 20)}
              >
                Load More
              </button>
            ) : null}
          </>
        )}
      </div>
    </DashboardPanel>
  );
}
