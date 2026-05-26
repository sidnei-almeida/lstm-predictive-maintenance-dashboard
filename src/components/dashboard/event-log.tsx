"use client";

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

export function EventLog() {
  const events = useMaintenanceStore((s) => s.events);

  return (
    <DashboardPanel
      title="Recent Event Log"
      description="System diagnostic log"
      className="min-h-[200px]"
      bodyClassName="p-0"
    >
      <div className="max-h-[320px] overflow-auto">
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
    </DashboardPanel>
  );
}
