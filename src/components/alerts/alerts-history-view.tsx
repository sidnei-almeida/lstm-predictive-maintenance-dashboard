"use client";

import { useMemo, useState } from "react";

import {
  ApiSystemCard,
  EventDetailsPanel,
  RiskEventTimeline,
  SessionPredictionReviewCard,
} from "@/components/alerts/alerts-sidebar";
import { TopKpiCard, TopKpiGrid, type VfdValueKind } from "@/components/layout/top-kpi-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEFAULT_EVENT_FILTERS,
  buildRiskTimeline,
  computeApiStats,
  computeHistoryKpis,
  computeOutcomeSummary,
  deriveModelPrediction,
  displayEventType,
  filterEvents,
  type EventFilters,
} from "@/lib/events";
import { getApiBaseUrl } from "@/lib/api/client";
import { THRESHOLD_DISPLAY } from "@/lib/features/constants";
import { useMaintenanceStore } from "@/store/maintenance-store";

const BADGES = [
  "Dataset Replay",
  "LSTM Inference",
  "Ground Truth Review",
  "Event Audit",
] as const;

function toneToVfd(tone?: "gold" | "danger"): VfdValueKind {
  if (tone === "danger") return "status-negative";
  if (tone === "gold") return "numeric";
  return "numeric";
}

export function AlertsHistoryView() {
  const events = useMaintenanceStore((s) => s.events);
  const bootReady = useMaintenanceStore((s) => s.bootReady);
  const streamStatus = useMaintenanceStore((s) => s.streamStatus);
  const apiHealthy = useMaintenanceStore((s) => s.apiHealthy);
  const apiUsesSimulated = useMaintenanceStore((s) => s.apiUsesSimulated);
  const rows = useMaintenanceStore((s) => s.rows);

  const [filters, setFilters] = useState<EventFilters>(DEFAULT_EVENT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => filterEvents(events, filters), [events, filters]);
  const kpis = useMemo(() => computeHistoryKpis(events), [events]);
  const outcome = useMemo(() => computeOutcomeSummary(events), [events]);
  const timeline = useMemo(() => buildRiskTimeline(events), [events]);
  const apiStats = useMemo(
    () => computeApiStats(events, apiHealthy, apiUsesSimulated, getApiBaseUrl()),
    [events, apiHealthy, apiUsesSimulated],
  );

  const selected =
    filtered.find((e) => e.id === selectedId) ?? events.find((e) => e.id === selectedId) ?? null;

  const kpiCards: { label: string; value: string; tone?: "gold" | "danger" }[] = [
    { label: "EVENTS RECORDED", value: String(kpis.eventsRecorded) },
    { label: "PREDICTIONS PROCESSED", value: String(kpis.predictionsProcessed) },
    {
      label: "PREDICTED FAILURE RISK",
      value: String(kpis.predictedFailureRisk),
      tone: kpis.predictedFailureRisk > 0 ? "danger" : undefined,
    },
    {
      label: "KNOWN FAILURE ROWS",
      value: String(kpis.knownFailureRows),
      tone: kpis.knownFailureRows > 0 ? "danger" : undefined,
    },
    {
      label: "MODEL / GT MISMATCHES",
      value: String(kpis.modelGroundTruthMismatches),
      tone: kpis.modelGroundTruthMismatches > 0 ? "gold" : undefined,
    },
    { label: "AVERAGE PROBABILITY", value: kpis.averageProbability, tone: "gold" },
    { label: "API EVENTS", value: String(kpis.apiEvents) },
  ];

  const hasPredictionHistory = events.some((e) => e.eventType === "prediction");

  return (
    <>
      <div className="flex flex-nowrap items-center gap-1 overflow-x-auto border border-[#333333] bg-black px-3 py-2">
        {BADGES.map((label) => (
          <span
            key={label}
            className="countach-pipeline-chip shrink-0 border border-[#333333] bg-[#050505] px-2 py-1 font-mono text-[8px] font-medium tracking-[0.12em] text-[#888888] uppercase"
          >
            {label}
          </span>
        ))}
      </div>

      <TopKpiGrid className="vfd-kpi-grid grid-cols-7">
        {kpiCards.map((kpi) => (
          <TopKpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            vfdValueKind={toneToVfd(kpi.tone)}
          />
        ))}
      </TopKpiGrid>

      <div className="retro-panel overflow-x-auto border-[#333333]">
        <div className="flex min-w-max flex-nowrap items-end gap-2 px-3 py-2">
          <div className="w-[10rem] shrink-0">
            <label className="micro-label">Search</label>
            <input
              type="search"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Event, packet, modes…"
              className="mt-0.5 h-8 w-full rounded-none border border-[#333333] bg-[#050505] px-2 font-mono text-xs text-[#ffffff] outline-none focus-visible:border-[#ffaa00]"
            />
          </div>
          <FilterSelect
            label="Prediction"
            value={filters.prediction}
            options={[
              ["all", "All"],
              ["healthy", "Healthy"],
              ["elevated", "Elevated Risk"],
              ["failure_risk", "Failure Risk"],
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, prediction: v }))}
          />
          <FilterSelect
            label="Ground truth"
            value={filters.groundTruth}
            options={[
              ["all", "All"],
              ["Normal", "Normal"],
              ["Failure", "Failure"],
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, groundTruth: v }))}
          />
          <FilterSelect
            label="Failure mode"
            value={filters.failureMode}
            options={[
              ["all", "All"],
              ["TWF", "TWF"],
              ["HDF", "HDF"],
              ["PWF", "PWF"],
              ["OSF", "OSF"],
              ["RNF", "RNF"],
              ["none", "None"],
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, failureMode: v }))}
          />
          <FilterSelect
            label="Event type"
            value={filters.eventType}
            options={[
              ["all", "All"],
              ["stream", "Stream"],
              ["prediction", "Prediction"],
              ["dataset", "Dataset"],
              ["api", "API"],
              ["user", "User Action"],
              ["system", "System"],
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, eventType: v }))}
          />
          <FilterSelect
            label="Probability"
            value={filters.minProbability}
            options={[
              ["all", "All"],
              ["40", `≥ 40%`],
              ["threshold", `≥ ${THRESHOLD_DISPLAY}%`],
              ["80", "≥ 80%"],
            ]}
            onChange={(v) => setFilters((f) => ({ ...f, minProbability: v }))}
          />
          <Button
            size="sm"
            variant="outline"
            className="mb-0.5 h-8 shrink-0"
            onClick={() => setFilters(DEFAULT_EVENT_FILTERS)}
          >
            Clear filters
          </Button>
        </div>
      </div>

      {!bootReady ? (
        <div className="border border-dashed border-[#333333] bg-black px-3 py-6 text-center font-mono text-[10px] tracking-wide text-[#888888] uppercase">
          Loading dataset and API — history will populate after boot completes.
        </div>
      ) : !hasPredictionHistory ? (
        <div className="flex flex-col gap-[3px]">
          <div className="border border-[#333333] bg-black px-3 py-6 text-center">
            <p className="font-mono text-[10px] font-bold tracking-wide text-[#ffaa00] uppercase">
              No prediction history recorded yet
            </p>
            <p className="card-footnote mt-1">
              Start the stream to collect model outputs. Dataset{" "}
              {rows.length.toLocaleString()} rows · API {apiHealthy ? "online" : "offline"} ·
              stream {streamStatus}.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-[3px]">
            <SessionPredictionReviewCard outcome={outcome} />
            <ApiSystemCard stats={apiStats} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[3px]">
          <div className="grid grid-cols-4 gap-[3px]">
            <div className="col-span-2">
              <RiskEventTimeline points={timeline} />
            </div>
            <SessionPredictionReviewCard outcome={outcome} />
            <ApiSystemCard stats={apiStats} />
          </div>

          <div className="grid grid-cols-3 gap-[3px]">
            <div className="col-span-2">
              <div className="flex h-[560px] flex-col border border-[#333333] bg-black">
                <div className="shrink-0 border-b border-[#222222] px-3 py-2">
                  <h2 className="card-title">Prediction &amp; Replay History</h2>
                  <p className="card-footnote mt-0.5">
                    {filtered.length} of {events.length} events · click row for details
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        {[
                          "Time",
                          "Packet",
                          "Type",
                          "Event",
                          "Prediction",
                          "Prob",
                          "Thr",
                          "GT",
                          "Mode",
                          "Source",
                          "Action",
                        ].map((col) => (
                          <TableHead
                            key={col}
                            className="countach-table-head table-head sticky top-0 z-10 whitespace-nowrap bg-black"
                          >
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={11}
                            className="h-8 text-center font-mono text-[10px] text-[#888888]"
                          >
                            No events match filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        filtered.map((entry) => (
                          <TableRow
                            key={entry.id}
                            className={`countach-table-row retro-table-row cursor-pointer font-mono text-[9px] ${
                              selectedId === entry.id ? "bg-[#ffaa00]/10" : ""
                            }`}
                            onClick={() => setSelectedId(entry.id)}
                          >
                            <TableCell className="whitespace-nowrap tabular-nums text-[#888888]">
                              {entry.time.toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="tabular-nums text-[#ffaa00]">
                              {entry.packet}
                            </TableCell>
                            <TableCell className="text-[#888888]">
                              {displayEventType(entry)}
                            </TableCell>
                            <TableCell className="max-w-[140px] truncate text-[#888888]">
                              {entry.event}
                            </TableCell>
                            <TableCell>{deriveModelPrediction(entry)}</TableCell>
                            <TableCell className="tabular-nums text-[#ffaa00]">
                              {entry.probability}
                            </TableCell>
                            <TableCell className="tabular-nums text-[#666666]">
                              {entry.threshold}
                            </TableCell>
                            <TableCell>{entry.groundTruth}</TableCell>
                            <TableCell className="max-w-[72px] truncate">
                              {entry.failureModes}
                            </TableCell>
                            <TableCell className="text-[#888888]">{entry.source}</TableCell>
                            <TableCell className="max-w-[120px] truncate">
                              {entry.action}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="h-[560px]">
              <EventDetailsPanel event={selected} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  return (
    <div className="w-[7.5rem] shrink-0">
      <label className="micro-label">{label}</label>
      <Select value={value} onValueChange={(v) => v != null && onChange(v)}>
        <SelectTrigger size="sm" className="mt-0.5 h-8 w-full rounded-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
