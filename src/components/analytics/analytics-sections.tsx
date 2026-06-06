"use client";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import { TopKpiCard, TopKpiGrid, type VfdValueKind } from "@/components/layout/top-kpi-card";
import type { DatasetAnalytics } from "@/lib/analytics/types";
import { getApiBaseUrl } from "@/lib/api/client";
import { SEQUENCE_LENGTH, THRESHOLD_DISPLAY } from "@/lib/features/constants";
import { formatMetricPct } from "@/lib/metrics/format";
import type { ModelMetricsBundle } from "@/lib/metrics/types";
import { cn } from "@/lib/utils";

import {
  GroupedComparisonChart,
  SimpleBarChart,
  ThresholdSweepChart,
  TorqueSpeedScatter,
  TrainingHistoryChart,
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
  metrics,
}: {
  data: DatasetAnalytics;
  metrics: ModelMetricsBundle;
}) {
  const d = metrics.dashboard;
  const train = metrics.training;
  const failureRatePct = (data.failureRate * 100).toFixed(2);

  const kpis: { label: string; value: string; vfdValueKind: VfdValueKind }[] = [
    { label: "TOTAL SAMPLES", value: data.totalSamples.toLocaleString(), vfdValueKind: "numeric" },
    { label: "FAILURE RATE", value: `${failureRatePct}%`, vfdValueKind: "numeric" },
    {
      label: "FAILURE RECALL",
      value: formatMetricPct(d.failure_recall),
      vfdValueKind: d.failure_recall >= 0.75 ? "status-positive" : "numeric",
    },
    {
      label: "ALERT PRECISION",
      value: formatMetricPct(d.alert_precision),
      vfdValueKind: "numeric",
    },
    {
      label: "F1 SCORE",
      value: formatMetricPct(d.f1_score),
      vfdValueKind: "numeric",
    },
    {
      label: "ROC-AUC",
      value: formatMetricPct(d.roc_auc),
      vfdValueKind: d.roc_auc >= 0.9 ? "status-positive" : "numeric",
    },
    {
      label: "PR-AUC",
      value: formatMetricPct(d.pr_auc),
      vfdValueKind: "numeric",
    },
    {
      label: "DECISION THR",
      value: `${Math.round(d.decision_threshold * 100)}%`,
      vfdValueKind: "numeric",
    },
    {
      label: "TRAIN EPOCHS",
      value: String(train.training_parameters.epochs),
      vfdValueKind: "numeric",
    },
  ];

  return (
    <TopKpiGrid className="vfd-kpi-grid grid-cols-9">
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

export function TrainingMetricsSection({
  metrics,
  data,
}: {
  metrics: ModelMetricsBundle;
  data: DatasetAnalytics;
}) {
  const { training, dashboard } = metrics;
  const eval_ = training.final_evaluation;
  const cm = dashboard.confusion_matrix;
  const [[tn, fp], [fn, tp]] = cm;
  const bestF1 = training.recommended_thresholds.best_f1;
  const recallOriented = training.recommended_thresholds.recall_oriented;

  return (
    <div className="flex flex-col gap-[3px]">
      <div className="grid grid-cols-4 gap-[3px]">
        <div className="col-span-2">
          <AnalyticsChartPanel
            title="Training History"
            footnote={`${training.training_parameters.epochs} epochs · batch ${training.training_parameters.batch_size} · class weight failure ${training.training_parameters.class_weight["1"].toFixed(1)}`}
          >
            <TrainingHistoryChart history={training.training_history} height={220} />
          </AnalyticsChartPanel>
        </div>
        <div className="col-span-2">
          <AnalyticsChartPanel
            title="Threshold Sweep"
            footnote={`Decision threshold ${Math.round(dashboard.decision_threshold * 100)}% · primary: ${dashboard.primary_metric.replace(/_/g, " ")}`}
          >
            <ThresholdSweepChart
              points={metrics.thresholdAnalysis}
              decisionThreshold={dashboard.decision_threshold}
              height={220}
            />
          </AnalyticsChartPanel>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[3px]">
        <AnalyticsChartPanel
          title="Failure Mode Breakdown"
          footnote="Explanatory only — not LSTM inputs (TWF/HDF/PWF/OSF/RNF)"
        >
          <SimpleBarChart data={data.failureModeBreakdown} height={160} />
        </AnalyticsChartPanel>

        <DashboardPanel title="Test Set Confusion Matrix" bodyClassName="p-3">
          <div className="grid grid-cols-[auto_1fr_1fr] gap-1 font-mono text-[9px] uppercase">
            <div />
            <div className="text-center text-[#666666]">Pred normal</div>
            <div className="text-center text-[#666666]">Pred failure</div>
            <div className="text-[#666666]">Actual normal</div>
            <div className="border border-[#333333] bg-[#050505] px-2 py-2 text-center tabular-nums text-[#00ff00]">
              {tn}
            </div>
            <div className="border border-[#333333] bg-[#050505] px-2 py-2 text-center tabular-nums text-[#ffaa00]">
              {fp}
            </div>
            <div className="text-[#666666]">Actual failure</div>
            <div className="border border-[#333333] bg-[#050505] px-2 py-2 text-center tabular-nums text-[#ffaa00]">
              {fn}
            </div>
            <div className="border border-[#333333] bg-[#050505] px-2 py-2 text-center tabular-nums text-[#00ff00]">
              {tp}
            </div>
          </div>
          <p className="card-footnote mt-3 border-t border-[#222222] pt-2">
            @ {Math.round(dashboard.decision_threshold * 100)}% threshold · test n=
            {training.dataset_info.testing_samples}
          </p>
        </DashboardPanel>

        <DashboardPanel title="Training Run Summary" bodyClassName="p-3">
          <StatTable
            rows={[
              { label: "Architecture", value: training.model_architecture },
              { label: "Train samples", value: training.dataset_info.training_samples.toLocaleString() },
              { label: "Test samples", value: training.dataset_info.testing_samples.toLocaleString() },
              { label: "Train failure rate", value: formatMetricPct(training.dataset_info.train_class_distribution.failure_rate) },
              { label: "Test failure rate", value: formatMetricPct(training.dataset_info.test_class_distribution.failure_rate) },
              { label: "Test loss", value: eval_.test_loss.toFixed(4) },
            ]}
          />
        </DashboardPanel>

        <DashboardPanel title="Threshold Recommendations" bodyClassName="p-3">
          <StatTable
            rows={[
              {
                label: `Best F1 @ ${Math.round(bestF1.threshold * 100)}%`,
                value: `F1 ${formatMetricPct(bestF1.f1_score)} · R ${formatMetricPct(bestF1.recall)}`,
              },
              {
                label: `Recall-oriented @ ${Math.round(recallOriented.threshold * 100)}%`,
                value: `R ${formatMetricPct(recallOriented.recall)} · P ${formatMetricPct(recallOriented.precision)}`,
              },
              {
                label: "Dashboard decision",
                value: `${Math.round(dashboard.decision_threshold * 100)}%`,
              },
              {
                label: "Default eval @ 50%",
                value: `F1 ${formatMetricPct(eval_.test_f1_score)}`,
              },
            ]}
          />
          <p className="card-footnote mt-3 border-t border-[#222222] pt-2">
            {dashboard.dataset_context.note}
          </p>
        </DashboardPanel>
      </div>
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
  metrics,
}: {
  data: DatasetAnalytics;
  metrics: ModelMetricsBundle;
}) {
  const q = data.dataQuality;
  const eval_ = metrics.training.final_evaluation;
  const report = eval_.classification_report as Record<
    string,
    { precision?: number; recall?: number; "f1-score"?: number; support?: number }
  >;

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

      <DashboardPanel title="Holdout Classification Report" className="h-full" bodyClassName="flex h-full flex-col p-3">
        <div className="grid flex-1 grid-cols-2 gap-[3px]">
          <StatTable
            rows={[
              {
                label: "Normal precision",
                value: formatMetricPct(report.normal?.precision ?? 0),
              },
              {
                label: "Normal recall",
                value: formatMetricPct(report.normal?.recall ?? 0),
              },
              {
                label: "Normal F1",
                value: formatMetricPct(report.normal?.["f1-score"] ?? 0),
              },
              { label: "Normal support", value: report.normal?.support ?? "—" },
            ]}
          />
          <StatTable
            rows={[
              {
                label: "Failure precision",
                value: formatMetricPct(report.failure?.precision ?? 0),
              },
              {
                label: "Failure recall",
                value: formatMetricPct(report.failure?.recall ?? 0),
              },
              {
                label: "Failure F1",
                value: formatMetricPct(report.failure?.["f1-score"] ?? 0),
              },
              { label: "Failure support", value: report.failure?.support ?? "—" },
              { label: "Macro F1", value: formatMetricPct((report["macro avg"]?.["f1-score"] as number) ?? 0) },
            ]}
          />
        </div>
        <p className="card-footnote mt-auto border-t border-[#222222] pt-3">
          Source: metrics/training_summary.json · @ {Math.round(eval_.threshold * 100)}% threshold ·
          accuracy is secondary on imbalanced data ({formatMetricPct(eval_.test_accuracy)}).
        </p>
      </DashboardPanel>
    </div>
  );
}

export function PipelineSection() {
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
      </DashboardPanel>
    </div>
  );
}

