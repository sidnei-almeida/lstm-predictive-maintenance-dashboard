"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { CountItem } from "@/lib/analytics/types";
import {
  VFD_ACTIVE_BAR,
  VFD_AXIS_FRAME,
  VFD_AXIS_TICK,
  VFD_BAR_COLORS,
  VFD_BAR_RADIUS,
  VFD_CHART_MARGIN,
  VFD_CHART_MARGIN_TALL_X,
  VFD_GRID,
  VFD_LEGEND_STYLE,
  VFD_PIE_ACTIVE,
  VFD_PLOT,
  VFD_TOOLTIP_PROPS,
} from "@/lib/charts/vfd-telemetry";

function chartStyle() {
  return { background: VFD_PLOT.bg };
}

export function SimpleBarChart({
  data,
  dataKey = "count",
  nameKey = "name",
  height = 180,
  unit = "",
}: {
  data: CountItem[];
  dataKey?: string;
  nameKey?: string;
  height?: number;
  unit?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={VFD_CHART_MARGIN_TALL_X} style={chartStyle()}>
        <CartesianGrid {...VFD_GRID} />
        <XAxis
          dataKey={nameKey}
          tick={VFD_AXIS_TICK}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={48}
          {...VFD_AXIS_FRAME}
        />
        <YAxis tick={VFD_AXIS_TICK} width={32} {...VFD_AXIS_FRAME} />
        <Tooltip
          {...VFD_TOOLTIP_PROPS}
          formatter={(v) => [`${v}${unit}`.toUpperCase(), "COUNT"]}
        />
        <Bar dataKey={dataKey} radius={VFD_BAR_RADIUS} activeBar={VFD_ACTIVE_BAR} className="countach-vfd-bars">
          {data.map((_, i) => (
            <Cell key={i} fill={VFD_BAR_COLORS[i % VFD_BAR_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RateBarChart({
  data,
  height = 180,
}: {
  data: CountItem[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={VFD_CHART_MARGIN} style={chartStyle()}>
        <CartesianGrid {...VFD_GRID} />
        <XAxis dataKey="name" tick={VFD_AXIS_TICK} {...VFD_AXIS_FRAME} />
        <YAxis tick={VFD_AXIS_TICK} unit="%" width={36} domain={[0, "auto"]} {...VFD_AXIS_FRAME} />
        <Tooltip
          {...VFD_TOOLTIP_PROPS}
          formatter={(v) => [`${v}%`.toUpperCase(), "FAILURE RATE"]}
        />
        <Bar
          dataKey="rate"
          fill={VFD_PLOT.threshold}
          radius={VFD_BAR_RADIUS}
          activeBar={VFD_ACTIVE_BAR}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data, height = 180 }: { data: CountItem[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart style={chartStyle()}>
        <Pie
          data={data}
          dataKey="count"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={64}
          paddingAngle={1}
          stroke={VFD_PLOT.grid}
          activeShape={VFD_PIE_ACTIVE}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={VFD_BAR_COLORS[i % VFD_BAR_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...VFD_TOOLTIP_PROPS} />
        <Legend wrapperStyle={VFD_LEGEND_STYLE} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function GroupedComparisonChart({
  data,
  height = 200,
}: {
  data: { feature: string; normalMean: number; failureMean: number }[];
  height?: number;
}) {
  const chartData = data.map((d) => ({
    name: d.feature.split(" ")[0],
    Normal: d.normalMean,
    Failure: d.failureMean,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={VFD_CHART_MARGIN} style={chartStyle()}>
        <CartesianGrid {...VFD_GRID} />
        <XAxis dataKey="name" tick={VFD_AXIS_TICK} {...VFD_AXIS_FRAME} />
        <YAxis tick={VFD_AXIS_TICK} width={40} {...VFD_AXIS_FRAME} />
        <Tooltip {...VFD_TOOLTIP_PROPS} />
        <Legend wrapperStyle={VFD_LEGEND_STYLE} />
        <Bar dataKey="Normal" fill={VFD_PLOT.barMid} radius={VFD_BAR_RADIUS} activeBar={VFD_ACTIVE_BAR} />
        <Bar dataKey="Failure" fill={VFD_PLOT.risk} radius={VFD_BAR_RADIUS} activeBar={VFD_ACTIVE_BAR} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WearBinChart({
  data,
  height = 200,
}: {
  data: { range: string; count: number; failureCount: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={VFD_CHART_MARGIN_TALL_X} style={chartStyle()}>
        <CartesianGrid {...VFD_GRID} />
        <XAxis
          dataKey="range"
          tick={VFD_AXIS_TICK}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={48}
          {...VFD_AXIS_FRAME}
        />
        <YAxis tick={VFD_AXIS_TICK} width={32} {...VFD_AXIS_FRAME} />
        <Tooltip {...VFD_TOOLTIP_PROPS} />
        <Legend wrapperStyle={VFD_LEGEND_STYLE} />
        <Bar
          dataKey="count"
          name="Samples"
          fill={VFD_PLOT.barMuted}
          radius={VFD_BAR_RADIUS}
          activeBar={VFD_ACTIVE_BAR}
        />
        <Bar
          dataKey="failureCount"
          name="Failures"
          fill={VFD_PLOT.risk}
          radius={VFD_BAR_RADIUS}
          activeBar={VFD_ACTIVE_BAR}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TorqueSpeedScatter({
  points,
  height = 200,
}: {
  points: { speed: number; torque: number; failure: 0 | 1 }[];
  height?: number;
}) {
  const normal = points.filter((p) => p.failure === 0);
  const failure = points.filter((p) => p.failure === 1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={VFD_CHART_MARGIN} style={chartStyle()}>
        <CartesianGrid {...VFD_GRID} />
        <XAxis
          type="number"
          dataKey="speed"
          name="RPM"
          tick={VFD_AXIS_TICK}
          unit=" rpm"
          {...VFD_AXIS_FRAME}
        />
        <YAxis
          type="number"
          dataKey="torque"
          name="Torque"
          tick={VFD_AXIS_TICK}
          width={36}
          unit=" Nm"
          {...VFD_AXIS_FRAME}
        />
        <Tooltip
          {...VFD_TOOLTIP_PROPS}
          cursor={{
            stroke: VFD_PLOT.cursorStroke,
            strokeWidth: 1,
            strokeDasharray: "4 4",
            fill: VFD_PLOT.cursorFill,
          }}
        />
        <Scatter
          name="Normal"
          data={normal}
          fill={VFD_PLOT.barMid}
          shape={({ cx, cy }) => {
            if (cx == null || cy == null) return null;
            return (
              <rect x={cx - 2} y={cy - 2} width={4} height={4} fill={VFD_PLOT.barMid} stroke="none" />
            );
          }}
        />
        <Scatter
          name="Failure"
          data={failure}
          fill={VFD_PLOT.risk}
          shape={({ cx, cy }) => {
            if (cx == null || cy == null) return null;
            return (
              <rect
                x={cx - 2}
                y={cy - 2}
                width={4}
                height={4}
                fill={VFD_PLOT.risk}
                stroke="none"
                className="countach-vfd-dot countach-vfd-dot--critical"
              />
            );
          }}
        />
        <Legend wrapperStyle={VFD_LEGEND_STYLE} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
