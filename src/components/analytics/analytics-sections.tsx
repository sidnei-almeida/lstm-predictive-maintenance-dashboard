"use client";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import { TopKpiCard, TopKpiGrid, type VfdValueKind } from "@/components/layout/top-kpi-card";
import type { DatasetAnalytics } from "@/lib/analytics/types";
import { getApiBaseUrl, type ApiMetadata } from "@/lib/api/client";
import { FEATURE_ORDER, SEQUENCE_LENGTH, THRESHOLD_DISPLAY } from "@/lib/features/constants";
import { cn } from "@/lib/utils";

import {
  DonutChart,
  GroupedComparisonChart,
  RateBarChart,
  SimpleBarChart,
  TorqueSpeedScatter,
  WearBinChart,
} from "./charts";
import { LstmCellSchematic } from "./lstm-cell-schematic";
import { FeatureSchemaRegisterArray } from "./feature-schema-register-array";
import { ModelOverviewSpecPlate } from "./model-overview-spec-plate";

function StatTable({
  rows,
}: {
  rows: { label: string; value: string | number }[];
}) {
  return (
    <dl className="divide-y divide-[#222222]">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
          <dt className="micro-label shrink-0">{r.label}</dt>
          <dd className="font-mono text-right text-[10px] font-medium tabular-nums text-[#ffaa00]">
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function AnalyticsChartPanel({
  title,
  description,
  footnote,
  className,
  children,
}: {
  title: string;
  description?: string;
  footnote?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <DashboardPanel
      title={title}
      description={description}
      className={cn("countach-chart-panel", className)}
      bodyClassName="p-0"
    >
      <div className="countach-chart-plot relative min-h-[180px] w-full px-2 py-2">{children}</div>
      {footnote ? <p className="card-footnote border-t border-[#222222] px-3 py-2">{footnote}</p> : null}
    </DashboardPanel>
  );
}

export function AnalyticsKpiRow({
  data,
  testAccuracy,
}: {
  data: DatasetAnalytics;
  testAccuracy: string;
}) {
  const failureRatePct = (data.failureRate * 100).toFixed(2);
  const accuracyNum = parseFloat(testAccuracy.replace(/[^\d.]/g, ""));

  const kpis: { label: string; value: string; vfdValueKind: VfdValueKind }[] = [
    { label: "TOTAL SAMPLES", value: data.totalSamples.toLocaleString(), vfdValueKind: "numeric" },
    {
      label: "FAILURE SAMPLES",
      value: data.failureSamples.toLocaleString(),
      vfdValueKind: "numeric",
    },
    { label: "FAILURE RATE", value: `${failureRatePct}%`, vfdValueKind: "numeric" },
    { label: "NORMAL SAMPLES", value: data.normalSamples.toLocaleString(), vfdValueKind: "numeric" },
    { label: "SENSOR FEATURES", value: String(data.sensorFeatureCount), vfdValueKind: "numeric" },
    { label: "SEQ. LENGTH", value: String(data.sequenceLength), vfdValueKind: "numeric" },
    { label: "INPUT SHAPE", value: data.modelInputShape, vfdValueKind: "numeric" },
    {
      label: "TEST ACCURACY",
      value: testAccuracy,
      vfdValueKind:
        testAccuracy === "—"
          ? "dim"
          : Number.isFinite(accuracyNum) && accuracyNum >= 90
            ? "status-positive"
            : "numeric",
    },
  ];

  return (
    <TopKpiGrid className="vfd-kpi-grid grid-cols-8">
      {kpis.map((kpi) => (
        <TopKpiCard
          key={kpi.label}
          label={kpi.label}
          value={kpi.vfdValueKind === "status-positive" ? `[ ${kpi.value} ]` : kpi.value}
          vfdValueKind={kpi.vfdValueKind}
        />
      ))}
    </TopKpiGrid>
  );
}

export function DistributionSection({ data }: { data: DatasetAnalytics }) {
  return (
    <div className="grid grid-cols-4 gap-[3px]">
      <AnalyticsChartPanel
        title="Class Distribution"
        footnote="Ground truth · Machine failure label"
      >
        <SimpleBarChart data={data.classDistribution} height={160} />
      </AnalyticsChartPanel>
      <AnalyticsChartPanel
        title="Failure Mode Breakdown"
        footnote="Explanatory only — not LSTM inputs (TWF/HDF/PWF/OSF/RNF)"
      >
        <SimpleBarChart data={data.failureModeBreakdown} height={160} />
      </AnalyticsChartPanel>
      <AnalyticsChartPanel title="Product Type Distribution">
        <DonutChart data={data.productTypeDistribution} height={160} />
      </AnalyticsChartPanel>
      <AnalyticsChartPanel title="Failure Rate by Product Type">
        <RateBarChart data={data.failureRateByType} height={160} />
      </AnalyticsChartPanel>
    </div>
  );
}

export function SensorSection({ data }: { data: DatasetAnalytics }) {
  return (
    <div className="grid grid-cols-3 gap-[3px]">
      <DashboardPanel title="Sensor Range Summary" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="countach-table-head-row">
                <th className="countach-table-head table-head px-3 py-2 text-left">Feature</th>
                <th className="countach-table-head table-head px-2 py-2 text-left">Min</th>
                <th className="countach-table-head table-head px-2 py-2 text-left">Mean</th>
                <th className="countach-table-head table-head px-2 py-2 text-left">Max</th>
                <th className="countach-table-head table-head px-3 py-2 text-left">Std</th>
              </tr>
            </thead>
            <tbody>
              {data.sensorStats.map((s, idx) => (
                <tr
                  key={s.key}
                  className={cn(
                    "countach-table-row border-b border-[#222222]",
                    idx % 2 === 1 && "countach-table-row--alt",
                  )}
                >
                  <td className="px-3 py-1.5 retro-txt-secondary">
                    {s.label}
                    <span className="metadata-text"> ({s.unit})</span>
                  </td>
                  <td className="px-2 py-1.5 font-mono tabular-nums text-[#ffaa00]">{s.min}</td>
                  <td className="px-2 py-1.5 font-mono tabular-nums text-[#ffaa00]">{s.mean}</td>
                  <td className="px-2 py-1.5 font-mono tabular-nums text-[#ffaa00]">{s.max}</td>
                  <td className="px-3 py-1.5 font-mono tabular-nums text-[#ffaa00]">{s.std}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="card-footnote border-t border-[#222222] px-3 py-2">
          Raw pred_maint.csv sensor readings
        </p>
      </DashboardPanel>

      <AnalyticsChartPanel
        title="Normal vs Failure Sensor Means"
        footnote="EDA comparison · interpretable units"
      >
        <GroupedComparisonChart data={data.sensorComparison} height={220} />
      </AnalyticsChartPanel>

      <DashboardPanel title="Temperature Gap Analysis">
        <StatTable
          rows={[
            { label: "Gap (normal avg)", value: `${data.temperatureGap.normalMean} K` },
            { label: "Gap (failure avg)", value: `${data.temperatureGap.failureMean} K` },
            { label: "Normal range", value: `${data.temperatureGap.normalMin} – ${data.temperatureGap.normalMax} K` },
            { label: "Failure range", value: `${data.temperatureGap.failureMin} – ${data.temperatureGap.failureMax} K` },
            { label: "High-gap threshold", value: `≥ ${data.temperatureGap.highGapThreshold} K` },
            { label: "High-gap samples", value: data.temperatureGap.highGapCount },
            { label: "HDF in high-gap", value: data.temperatureGap.hdfAmongHighGap },
          ]}
        />
        <p className="card-footnote mt-3">
          Derived: process temp − air temp · HDF is failure-mode context
        </p>
      </DashboardPanel>
    </div>
  );
}

export function SensorChartsRow({ data }: { data: DatasetAnalytics }) {
  return (
    <div className="grid grid-cols-2 gap-[3px]">
      <AnalyticsChartPanel
        title="Tool Wear Distribution"
        footnote="25 min bins · failure count overlay"
      >
        <WearBinChart data={data.toolWearBins} height={200} />
      </AnalyticsChartPanel>
      <AnalyticsChartPanel
        title="Torque vs Rotational Speed"
        footnote={`Subsampled scatter (${data.torqueSpeedScatter.length} pts) · red = failure`}
      >
        <TorqueSpeedScatter points={data.torqueSpeedScatter} height={200} />
      </AnalyticsChartPanel>
    </div>
  );
}

export function RiskFactorSection({ data }: { data: DatasetAnalytics }) {
  return (
    <DashboardPanel
      title="Operational Risk Factor Analysis (EDA)"
      description="Comparative indicators — not SHAP or model feature importance"
    >
      <div className="grid grid-cols-4 gap-[3px]">
        {data.riskFactors.map((card) => (
          <div key={card.id} className="retro-inset border border-[#333333] p-3">
            <p className="font-mono text-[9px] font-bold tracking-[0.15em] text-[#ffaa00] uppercase">
              {card.title}
            </p>
            <dl className="mt-2 divide-y divide-[#222222]">
              {card.metrics.map((m) => (
                <div key={m.label} className="flex justify-between gap-2 py-1.5 first:pt-0">
                  <dt className="micro-label">{m.label}</dt>
                  <dd className="font-mono text-[10px] font-medium tabular-nums text-[#ffaa00]">
                    {m.value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="card-footnote mt-2 border-t border-[#222222] pt-2">{card.note}</p>
          </div>
        ))}
      </div>
    </DashboardPanel>
  );
}

export function ModelSection({ data }: { data: DatasetAnalytics }) {
  return (
    <div className="flex flex-col gap-[3px]">
      <div className="grid grid-cols-2 items-stretch gap-[3px]">
        <DashboardPanel
          title="Model Overview"
          bodyClassName="flex min-h-0 flex-1 flex-col p-2"
        >
          <ModelOverviewSpecPlate className="min-h-0 flex-1" />
        </DashboardPanel>

        <DashboardPanel
          title="Processed Tensor Summary"
          bodyClassName="flex min-h-0 flex-1 flex-col"
        >
        <StatTable
          rows={[
            { label: "X shape", value: data.processed.xShape },
            { label: "y shape", value: data.processed.yShape },
            { label: "Layout", value: data.processed.layout },
            { label: "Features", value: data.processed.featureCount },
            { label: "Window", value: data.processed.sequenceLength ?? SEQUENCE_LENGTH },
            { label: "X min", value: data.processed.valueMin },
            { label: "X mean", value: data.processed.valueMean },
            { label: "X max", value: data.processed.valueMax },
            { label: "X std", value: data.processed.valueStd },
            { label: "y=1", value: data.processed.labelOnes },
            { label: "y=0", value: data.processed.labelZeros },
          ]}
        />
        <p className="card-footnote mt-auto border-t border-[#222222] pt-2">
          X_processed.npy · y_processed.npy
        </p>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Model Details" bodyClassName="flex min-h-[400px] flex-col p-0">
        <div className="grid min-h-[400px] flex-1 grid-cols-2">
          <section className="flex min-h-0 flex-col border-r border-[#333333]">
            <header className="shrink-0 border-b border-[#333333] px-3 py-2">
              <h3 className="micro-label">How the LSTM Works</h3>
            </header>
            <LstmCellSchematic className="min-h-0 flex-1" />
          </section>
          <section className="flex min-h-0 flex-col">
            <header className="shrink-0 border-b border-[#333333] px-3 py-2">
              <h3 className="micro-label">Feature Schema</h3>
            </header>
            <div className="flex min-h-0 flex-1 flex-col p-2">
              <FeatureSchemaRegisterArray />
            </div>
          </section>
        </div>
      </DashboardPanel>
    </div>
  );
}

export function QualityMetadataSection({
  data,
  metadata,
}: {
  data: DatasetAnalytics;
  metadata: ApiMetadata | null;
}) {
  const q = data.dataQuality;
  const training = metadata?.training;
  const datasetMeta = metadata?.dataset;

  return (
    <div className="grid grid-cols-2 items-stretch gap-[3px]">
      <DashboardPanel title="Data Quality & Label Consistency" className="h-full" bodyClassName="flex h-full flex-col">
        <div className="grid flex-1 grid-cols-2 gap-[3px]">
          <StatTable
            rows={[
              { label: "Missing / invalid rows", value: q.missingValues },
              { label: "Duplicate UDI rows", value: q.duplicateUdiRows },
              { label: "Class imbalance", value: q.classImbalanceRatio },
              { label: "Machine failure count", value: q.machineFailureCount },
            ]}
          />
          <StatTable
            rows={[
              { label: "Failure mode flags (sum)", value: q.failureModeOccurrences },
              { label: "Failure w/o mode flag", value: q.failureWithoutMode },
              { label: "Mode w/o machine failure", value: q.modeWithoutFailure },
            ]}
          />
        </div>
        <p className="card-footnote mt-auto border-t border-[#222222] pt-3">
          AI4I dataset: rare failures; failure-mode columns can exceed machine-failure count when
          multiple modes co-occur. Modes are analytics context only.
        </p>
      </DashboardPanel>

      <DashboardPanel title="Model Metadata (API)" className="h-full" bodyClassName="flex h-full flex-col">
        {metadata ? (
          <div className="grid flex-1 grid-cols-2 gap-[3px]">
            <StatTable
              rows={[
                { label: "Project", value: metadata.project ?? "—" },
                { label: "Version", value: metadata.version ?? "—" },
                { label: "Sequence length", value: metadata.sequence_length ?? SEQUENCE_LENGTH },
                { label: "Features", value: metadata.features?.length ?? FEATURE_ORDER.length },
                { label: "Dataset samples", value: datasetMeta?.samples?.toLocaleString() ?? "—" },
                {
                  label: "Dataset failure rate",
                  value:
                    datasetMeta?.failure_rate != null
                      ? `${(datasetMeta.failure_rate * 100).toFixed(2)}%`
                      : "—",
                },
                { label: "Epochs", value: training?.parameters?.epochs ?? "—" },
              ]}
            />
            <StatTable
              rows={[
                { label: "Batch size", value: training?.parameters?.batch_size ?? "—" },
                {
                  label: "Test accuracy",
                  value:
                    training?.evaluation?.test_accuracy != null
                      ? `${(training.evaluation.test_accuracy * 100).toFixed(2)}%`
                      : "—",
                },
                {
                  label: "Test loss",
                  value: training?.evaluation?.test_loss?.toFixed(4) ?? "—",
                },
                { label: "Architecture", value: training?.architecture ?? "—" },
              ]}
            />
          </div>
        ) : (
          <p className="card-footnote flex flex-1 items-center">
            Metadata unavailable — API offline or unreachable.
          </p>
        )}
      </DashboardPanel>
    </div>
  );
}

export function PipelineSection({ metadataError }: { metadataError: string | null }) {
  const apiBase = getApiBaseUrl();

  return (
    <div className="grid grid-cols-1 gap-[3px]">
      <DashboardPanel title="API Contract">
        <dl className="space-y-2 text-[10px]">
          <div>
            <dt className="micro-label">Base URL</dt>
            <dd className="mt-0.5 break-all font-mono text-[#00ff00]">{apiBase}</dd>
          </div>
          <div>
            <dt className="micro-label">Dashboard endpoints</dt>
            <dd className="mt-0.5 font-mono text-[#888888]">GET /health · POST /predict</dd>
          </div>
          <div>
            <dt className="micro-label">Analytics / test</dt>
            <dd className="mt-0.5 font-mono text-[#888888]">GET /metadata · GET /sample</dd>
          </div>
        </dl>
        <pre className="retro-inset mt-3 max-h-32 overflow-auto border border-[#333333] bg-[#050505] p-2 font-mono text-[9px] leading-relaxed text-[#00ff00]">
{`POST /predict
{ "sequence": [[7 floats] × 50] }

→ probability, predicted_label,
  threshold, details`}
        </pre>
        <p className="card-footnote mt-2">
          /sample → predicted_probability · /predict → probability (stream)
        </p>
        {metadataError ? (
          <p className="mt-2 font-mono text-[10px] tracking-wide text-[#ff0000] uppercase">
            {metadataError}
          </p>
        ) : null}
      </DashboardPanel>
    </div>
  );
}

