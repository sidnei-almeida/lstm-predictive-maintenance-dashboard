"use client";

import { useEffect, useState } from "react";

import type { DatasetAnalytics } from "@/lib/analytics/types";
import type { ModelMetricsBundle } from "@/lib/metrics/types";

import { AnalyticsPageShell } from "./analytics-page-shell";
import {
  AnalyticsKpiRow,
  ModelSection,
  PipelineSection,
  QualityMetadataSection,
  RiskFactorSection,
  SensorChartsRow,
  SensorSection,
  TrainingMetricsSection,
} from "./analytics-sections";

function AnalyticsLoadingState() {
  return (
    <div className="flex min-h-[240px] items-center justify-center border border-[#222222] bg-black">
      <p className="font-mono text-[10px] font-medium tracking-[0.2em] text-[#666666] uppercase">
        Computing dataset &amp; tensor analytics…
      </p>
    </div>
  );
}

function AnalyticsErrorState({ message }: { message: string }) {
  return (
    <div className="border border-[#ff0000]/40 bg-black px-4 py-3">
      <p className="font-mono text-[10px] font-medium tracking-wide text-[#ff0000] uppercase">
        {message}
      </p>
    </div>
  );
}

export function AnalyticsView() {
  const [data, setData] = useState<DatasetAnalytics | null>(null);
  const [metrics, setMetrics] = useState<ModelMetricsBundle | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [analyticsRes, metricsRes] = await Promise.all([
          fetch("/api/analytics", { cache: "no-store" }).then(async (r) => {
            if (!r.ok) {
              const err = await r.json().catch(() => ({}));
              throw new Error((err as { error?: string }).error ?? "Analytics failed");
            }
            return r.json() as Promise<DatasetAnalytics>;
          }),
          fetch("/api/metrics", { cache: "no-store" }).then(async (r) => {
            if (!r.ok) {
              const err = await r.json().catch(() => ({}));
              throw new Error((err as { error?: string }).error ?? "Metrics failed");
            }
            return r.json() as Promise<ModelMetricsBundle>;
          }),
        ]);

        if (cancelled) return;
        setData(analyticsRes);
        setMetrics(metricsRes);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load analytics");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <AnalyticsPageShell>
        <AnalyticsLoadingState />
      </AnalyticsPageShell>
    );
  }

  if (loadError || !data || !metrics) {
    return (
      <AnalyticsPageShell>
        <AnalyticsErrorState message={loadError ?? "Analytics unavailable"} />
      </AnalyticsPageShell>
    );
  }

  return (
    <AnalyticsPageShell>
      <AnalyticsKpiRow data={data} metrics={metrics} />

      <TrainingMetricsSection metrics={metrics} data={data} />

      <SensorSection data={data} />

      <SensorChartsRow data={data} />

      <RiskFactorSection data={data} />

      <ModelSection data={data} />

      <QualityMetadataSection data={data} metrics={metrics} />

      <PipelineSection />
    </AnalyticsPageShell>
  );
}
