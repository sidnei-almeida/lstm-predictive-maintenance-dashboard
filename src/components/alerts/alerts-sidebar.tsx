"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import {
  ALERTS_TIMELINE_CHART_HEIGHT,
  VfdChartFrame,
} from "@/components/charts/vfd-chart-frame";
import type { ApiEventStats, OutcomeSummary, TimelinePoint } from "@/lib/events";
import {
  deriveModelPrediction,
  deriveModelRiskBand,
} from "@/lib/events";
import { THRESHOLD_DISPLAY } from "@/lib/features/constants";
import { formatDisplayPercentLabel } from "@/lib/maintenance/status";
import {
  VFD_AXIS_FRAME,
  VFD_AXIS_TICK,
  VFD_CHART_MARGIN,
  VFD_GRID,
  VFD_PLOT,
  VFD_TOOLTIP_PROPS,
} from "@/lib/charts/vfd-telemetry";
import type { MaintenanceEvent } from "@/lib/types/maintenance";

export function RiskEventTimeline({ points }: { points: TimelinePoint[] }) {
  return (
    <DashboardPanel title="Model Probability Timeline" className="countach-chart-panel" bodyClassName="p-0">
      <p className="card-footnote border-b border-[#222222] px-3 py-1.5">
        Model-derived · session replay
      </p>
      {points.length === 0 ? (
        <p className="card-footnote px-3 py-2">No processed predictions in session yet.</p>
      ) : (
        <VfdChartFrame height={ALERTS_TIMELINE_CHART_HEIGHT}>
          <LineChart
            data={points}
            margin={VFD_CHART_MARGIN}
            style={{ background: VFD_PLOT.bg }}
          >
              <CartesianGrid {...VFD_GRID} />
              <XAxis dataKey="packetId" tick={VFD_AXIS_TICK} {...VFD_AXIS_FRAME} />
              <YAxis
                domain={[0, 100]}
                tick={VFD_AXIS_TICK}
                width={32}
                unit="%"
                {...VFD_AXIS_FRAME}
              />
              <ReferenceLine
                y={THRESHOLD_DISPLAY}
                stroke={VFD_PLOT.threshold}
                strokeWidth={1}
                strokeDasharray="4 4"
                label={{
                  value: `${THRESHOLD_DISPLAY}%`.toUpperCase(),
                  position: "insideTopRight",
                  fontSize: 9,
                  fill: VFD_PLOT.threshold,
                  fontFamily: VFD_AXIS_TICK.fontFamily,
                  letterSpacing: "0.12em",
                }}
              />
              <Tooltip
                {...VFD_TOOLTIP_PROPS}
                formatter={(v) => [`${Number(v).toFixed(1)}%`.toUpperCase(), "PROBABILITY"]}
              />
              <Line
                type="stepAfter"
                dataKey="probability"
                stroke={VFD_PLOT.line}
                strokeWidth={1.5}
                className="countach-vfd-line"
                connectNulls
                isAnimationActive={false}
                dot={({ cx, cy, payload }) => {
                  const p = payload as TimelinePoint;
                  const critical = p.kind === "failure_risk" || p.kind === "known_failure";
                  const elevated = p.kind === "elevated";
                  const size = critical ? 4 : 3;
                  if (cx == null || cy == null) return null;
                  const fill = critical
                    ? VFD_PLOT.dotCritical
                    : elevated
                      ? VFD_PLOT.threshold
                      : VFD_PLOT.dot;
                  return (
                    <rect
                      x={cx - size / 2}
                      y={cy - size / 2}
                      width={size}
                      height={size}
                      fill={fill}
                      stroke="none"
                      className={
                        critical ? "countach-vfd-dot countach-vfd-dot--critical" : "countach-vfd-dot"
                      }
                    />
                  );
                }}
                activeDot={({ cx, cy, payload }) => {
                  const p = payload as TimelinePoint;
                  const critical = p.kind === "failure_risk" || p.kind === "known_failure";
                  const size = 4;
                  if (cx == null || cy == null) return null;
                  return (
                    <rect
                      x={cx - size / 2}
                      y={cy - size / 2}
                      width={size}
                      height={size}
                      fill={critical ? VFD_PLOT.dotCritical : VFD_PLOT.dot}
                      stroke="none"
                      className={
                        critical ? "countach-vfd-dot countach-vfd-dot--critical" : "countach-vfd-dot"
                      }
                    />
                  );
                }}
              />
          </LineChart>
        </VfdChartFrame>
      )}
      <p className="mt-2 text-[10px] text-muted-foreground">
        Elevated = prob ≥ 40% · Failure risk = prob ≥ threshold · red = known failure row
      </p>
    </DashboardPanel>
  );
}

export function SessionPredictionReviewCard({ outcome }: { outcome: OutcomeSummary }) {
  return (
    <DashboardPanel title="Session Prediction Review">
      <p className="card-subtitle mb-2">
        Session-based, from replayed packets only
      </p>
      {!outcome.hasData ? (
        <p className="text-xs text-muted-foreground">
          Start stream to collect prediction/ground-truth comparisons.
        </p>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="micro-label">True positives</dt>
              <dd className="font-mono font-medium">{outcome.truePositives}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="micro-label">False positives</dt>
              <dd className="font-mono font-medium">{outcome.falsePositives}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="micro-label">True negatives</dt>
              <dd className="font-mono font-medium">{outcome.trueNegatives}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="micro-label">Missed failures</dt>
              <dd className="font-mono font-medium">{outcome.missedFailures}</dd>
            </div>
            <div className="col-span-2 flex justify-between gap-2">
              <dt className="micro-label">Precision</dt>
              <dd className="font-mono font-medium">{outcome.precision}</dd>
            </div>
            <div className="col-span-2 flex justify-between gap-2">
              <dt className="micro-label">Recall</dt>
              <dd className="font-mono font-medium">{outcome.recall}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[9px] leading-snug text-muted-foreground">
            TP: predicted failure risk + GT failure · FP: predicted risk + GT normal · TN: healthy +
            normal · Missed: healthy + GT failure
          </p>
        </>
      )}
    </DashboardPanel>
  );
}

export function ApiSystemCard({ stats }: { stats: ApiEventStats }) {
  return (
    <DashboardPanel title="API / System Events">
      <dl className="space-y-1.5 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="micro-label">Health</dt>
          <dd className="font-medium">{stats.healthy ? "Online" : "Offline"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="micro-label">Last check</dt>
          <dd className="font-mono text-[11px]">{stats.lastHealthLabel}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="micro-label">Avg latency</dt>
          <dd className="font-mono">{stats.avgLatencyMs}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="micro-label">Failed requests</dt>
          <dd className="font-mono">{stats.failedRequests}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="micro-label">API host</dt>
          <dd className="truncate font-mono text-[11px]">{stats.apiHost}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="micro-label">Model engine</dt>
          <dd className="font-medium">{stats.modelEngine}</dd>
        </div>
      </dl>
    </DashboardPanel>
  );
}

const TERMINAL_LABEL =
  "font-mono text-[9px] font-normal uppercase leading-tight text-[#666666]";
const TERMINAL_SECTION =
  "mb-1 w-full border-b border-dashed border-[#333] pb-0.5 font-mono text-xs uppercase leading-tight text-[#555555]";
const TERMINAL_VALUE =
  "font-mono text-[9px] leading-tight text-[#ffaa00]";
const TERMINAL_VALUE_POSITIVE =
  "font-mono text-[9px] leading-tight text-[#00ff00]";

function isPositiveTerminalValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v === "healthy" || v === "normal" || v === "low" || v === "0") return true;
  if (v === "0%" || v.startsWith("0.0%") || v.startsWith("<0")) return true;
  if (v.startsWith("low ")) return true;
  return false;
}

function terminalValueClass(value: string, forcePositive?: boolean): string {
  return forcePositive || isPositiveTerminalValue(value)
    ? TERMINAL_VALUE_POSITIVE
    : TERMINAL_VALUE;
}

function TerminalSectionHeader({ children }: { children: string }) {
  return <p className={TERMINAL_SECTION}>{children}</p>;
}

function TerminalRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <dt className={TERMINAL_LABEL}>{label}</dt>
      <dd className={terminalValueClass(value, positive)}>{value}</dd>
    </div>
  );
}

export function EventDetailsPanel({ event }: { event: MaintenanceEvent | null }) {
  if (!event) {
    return (
      <DashboardPanel
        title="Event Details"
        className="flex h-[560px] flex-col"
        bodyClassName="overflow-auto font-mono leading-tight"
      >
        <p className="font-mono text-[9px] leading-tight text-[#888888]">
          Select a row to inspect sensors, model output, and ground truth.
        </p>
      </DashboardPanel>
    );
  }

  const prediction = deriveModelPrediction(event);
  const riskBand = deriveModelRiskBand(event);
  const riskBandLabel = `${riskBand} (model-derived)`;
  const probLabel =
    event.rawProbability != null
      ? formatDisplayPercentLabel(
          event.displayProbability ?? event.rawProbability * 100,
          event.rawProbability,
        )
      : event.probability;
  const predictedLabelText =
    event.predictedLabel != null ? String(event.predictedLabel) : "—";
  const engineLabel =
    event.usesSimulatedModel === true
      ? "Simulated API Model"
      : event.usesSimulatedModel === false
        ? "TensorFlow LSTM"
        : "—";
  const actionPrompt = `> RECOMMENDED ACTION: [ ${event.action.toUpperCase()} ]`;

  return (
    <DashboardPanel
      title="Event Details"
      className="flex h-[560px] flex-col"
      bodyClassName="min-h-0 flex-1 space-y-2 overflow-auto font-mono leading-tight"
    >
      <dl className="space-y-1">
        <TerminalRow label="Timestamp" value={event.time.toLocaleString()} />
        <TerminalRow label="Packet" value={event.packet} />
        {event.rowIndex != null ? (
          <TerminalRow label="CSV row index" value={String(event.rowIndex)} />
        ) : null}
      </dl>

      {(event.productId || event.productType) && (
        <div>
          <TerminalSectionHeader>Asset</TerminalSectionHeader>
          <p className={TERMINAL_VALUE}>
            Product ID {event.productId ?? "—"} · Type {event.productType ?? "—"}
          </p>
        </div>
      )}

      {event.sensorSnapshot ? (
        <div>
          <TerminalSectionHeader>Sensor snapshot</TerminalSectionHeader>
          <dl className="grid grid-cols-2 gap-1">
            <dt className={TERMINAL_LABEL}>Air temp</dt>
            <dd className={TERMINAL_VALUE}>{event.sensorSnapshot.airTemperatureK} K</dd>
            <dt className={TERMINAL_LABEL}>Process temp</dt>
            <dd className={TERMINAL_VALUE}>{event.sensorSnapshot.processTemperatureK} K</dd>
            <dt className={TERMINAL_LABEL}>RPM</dt>
            <dd className={TERMINAL_VALUE}>{event.sensorSnapshot.rotationalSpeedRpm}</dd>
            <dt className={TERMINAL_LABEL}>Torque</dt>
            <dd className={TERMINAL_VALUE}>{event.sensorSnapshot.torqueNm} Nm</dd>
            <dt className={TERMINAL_LABEL}>Tool wear</dt>
            <dd className={TERMINAL_VALUE}>{event.sensorSnapshot.toolWearMin} min</dd>
          </dl>
        </div>
      ) : null}

      {event.rawProbability != null ? (
        <div>
          <TerminalSectionHeader>LSTM output</TerminalSectionHeader>
          <dl className="space-y-1">
            <TerminalRow label="Probability" value={probLabel} />
            <TerminalRow label="Raw" value={event.rawProbability.toFixed(6)} />
            <TerminalRow
              label="Prediction"
              value={prediction}
              positive={prediction === "Healthy"}
            />
            <TerminalRow
              label="Risk band"
              value={riskBandLabel}
              positive={riskBand === "Low"}
            />
            <TerminalRow
              label="Predicted label"
              value={predictedLabelText}
              positive={event.predictedLabel === 0}
            />
            <TerminalRow
              label="Threshold"
              value={String(event.thresholdRaw ?? event.threshold)}
            />
            <TerminalRow
              label="Latency"
              value={event.latencyMs != null ? `${event.latencyMs} ms` : "—"}
            />
            <TerminalRow label="Engine" value={engineLabel} />
          </dl>
        </div>
      ) : null}

      <div>
        <TerminalSectionHeader>Ground truth</TerminalSectionHeader>
        <dl className="space-y-1">
          <TerminalRow
            label="Machine failure"
            value={event.groundTruth}
            positive={event.groundTruth === "Normal"}
          />
          {event.failureModes !== "—" ? (
            <TerminalRow label="Modes" value={event.failureModes} />
          ) : null}
        </dl>
      </div>

      {event.sequenceRange ? (
        <div>
          <TerminalSectionHeader>Sequence window</TerminalSectionHeader>
          <p className={TERMINAL_VALUE}>
            Rows {event.sequenceRange.start}–{event.sequenceRange.end} · length{" "}
            {event.sequenceRange.length}
          </p>
        </div>
      ) : null}

      <div className="border border-[#00ff00] bg-[#001100] px-2 py-1.5">
        <p className="font-mono text-[9px] leading-tight text-[#00ff00]">{actionPrompt}</p>
      </div>
    </DashboardPanel>
  );
}
