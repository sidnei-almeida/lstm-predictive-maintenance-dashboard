"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import {
  VFD_AXIS_FRAME,
  VFD_AXIS_TICK,
  VFD_CHART_MARGIN,
  VFD_GRID,
  VFD_MONO,
  VFD_PLOT,
  VFD_TOOLTIP_PROPS,
} from "@/lib/charts/vfd-telemetry";
import { SEQUENCE_LENGTH, THRESHOLD_DISPLAY } from "@/lib/features/constants";
import { formatDisplayPercentLabel } from "@/lib/maintenance/status";
import { selectSequenceFill, useMaintenanceStore } from "@/store/maintenance-store";

function formatTooltipPercent(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return formatDisplayPercentLabel(n);
}

function isCriticalPoint(probabilityDisplay: number, knownFailure?: boolean): boolean {
  return Boolean(knownFailure) || probabilityDisplay >= 50;
}

function SquareDot({
  cx,
  cy,
  payload,
  size = 3,
}: {
  cx?: number;
  cy?: number;
  payload?: { probabilityDisplay: number; knownFailure?: boolean };
  size?: number;
}) {
  if (cx == null || cy == null || !payload) return null;
  const critical = isCriticalPoint(payload.probabilityDisplay, payload.knownFailure);
  const half = size / 2;
  return (
    <rect
      x={cx - half}
      y={cy - half}
      width={size}
      height={size}
      fill={critical ? VFD_PLOT.dotCritical : VFD_PLOT.dot}
      stroke="none"
      className={critical ? "countach-vfd-dot countach-vfd-dot--critical" : "countach-vfd-dot"}
    />
  );
}

export function FailureProbabilityTrend() {
  const chartPoints = useMaintenanceStore((s) => s.chartPoints);
  const fill = useMaintenanceStore(selectSequenceFill);
  const hasTrend = fill >= SEQUENCE_LENGTH && chartPoints.length > 0;

  const data = chartPoints.map((p) => ({
    ...p,
    timeLabel: new Date(p.timestamp)
      .toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .toUpperCase(),
  }));

  return (
    <DashboardPanel
      title="Failure Probability Trend"
      description="Temporal risk · replay packets"
      className="countach-chart-panel h-full min-h-[300px]"
      bodyClassName="flex min-h-0 flex-1 flex-col p-0"
    >
      {!hasTrend ? (
        <div className="countach-chart-plot flex min-h-[280px] flex-1 items-center justify-center">
          <p
            className="px-4 text-center font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-[#666666]"
            style={{ fontFamily: VFD_MONO }}
          >
            Waiting for inference trend
          </p>
        </div>
      ) : (
        <div className="countach-chart-plot relative min-h-[280px] w-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={VFD_CHART_MARGIN}
              style={{ background: VFD_PLOT.bg }}
            >
              <CartesianGrid {...VFD_GRID} />
              <XAxis
                dataKey="timeLabel"
                tick={VFD_AXIS_TICK}
                tickFormatter={(v) => String(v).toUpperCase()}
                interval="preserveStartEnd"
                height={24}
                {...VFD_AXIS_FRAME}
              />
              <YAxis
                domain={[0, 100]}
                tick={VFD_AXIS_TICK}
                tickFormatter={(v) => `${v}`}
                unit="%"
                width={36}
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
                  fontFamily: VFD_MONO,
                  letterSpacing: "0.12em",
                }}
              />
              <Tooltip
                {...VFD_TOOLTIP_PROPS}
                formatter={(value) => [
                  formatTooltipPercent(value).toUpperCase(),
                  "PROBABILITY",
                ]}
                labelFormatter={(_, payload) => {
                  const p = payload?.[0]?.payload as (typeof data)[0] | undefined;
                  if (!p) return "";
                  const prob = formatTooltipPercent(p.probabilityDisplay);
                  return `PKT ${p.packetId} · ${prob}`.toUpperCase();
                }}
              />
              <Line
                type="stepAfter"
                dataKey="probabilityDisplay"
                stroke={VFD_PLOT.line}
                strokeWidth={1.5}
                className="countach-vfd-line"
                connectNulls
                isAnimationActive={false}
                dot={(props) => {
                  const point = props.payload as (typeof data)[0];
                  const critical = isCriticalPoint(
                    point.probabilityDisplay,
                    point.knownFailure,
                  );
                  const size = critical ? 4 : 3;
                  return (
                    <SquareDot
                      cx={props.cx}
                      cy={props.cy}
                      payload={point}
                      size={size}
                    />
                  );
                }}
                activeDot={(props) => {
                  const point = props.payload as (typeof data)[0];
                  return (
                    <SquareDot
                      cx={props.cx}
                      cy={props.cy}
                      payload={point}
                      size={4}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardPanel>
  );
}
