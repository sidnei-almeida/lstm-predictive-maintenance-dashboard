"use client";

import { useEffect, useState } from "react";

import type { DatasetAnalytics } from "@/lib/analytics/types";
import { fetchMetadata, type ApiMetadata } from "@/lib/api/client";

import { AnalyticsPageShell } from "./analytics-page-shell";
import {
  AnalyticsKpiRow,
  DistributionSection,
  ModelSection,
  PipelineSection,
  QualityMetadataSection,
  RiskFactorSection,
  SensorChartsRow,
  SensorSection,
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
  const [metadata, setMetadata] = useState<ApiMetadata | null>(null);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const [analyticsRes, metaResult] = await Promise.allSettled([
          fetch("/api/analytics", { cache: "no-store" }).then(async (r) => {
            if (!r.ok) {
              const err = await r.json().catch(() => ({}));
              throw new Error((err as { error?: string }).error ?? "Analytics failed");
            }
            return r.json() as Promise<DatasetAnalytics>;
          }),
          fetchMetadata(),
        ]);

        if (cancelled) return;

        if (analyticsRes.status === "fulfilled") {
          setData(analyticsRes.value);
        } else {
          setLoadError(
            analyticsRes.reason instanceof Error
              ? analyticsRes.reason.message
              : "Failed to load analytics",
          );
        }

        if (metaResult.status === "fulfilled") {
          setMetadata(metaResult.value);
          setMetadataError(null);
        } else {
          setMetadata(null);
          setMetadataError("Could not load /metadata from inference API");
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

  if (loadError || !data) {
    return (
      <AnalyticsPageShell>
        <AnalyticsErrorState message={loadError ?? "Analytics unavailable"} />
      </AnalyticsPageShell>
    );
  }

  const testAccuracy =
    metadata?.training?.evaluation?.test_accuracy != null
      ? `${(metadata.training.evaluation.test_accuracy * 100).toFixed(2)}%`
      : "—";

  return (
    <AnalyticsPageShell>
      <AnalyticsKpiRow data={data} testAccuracy={testAccuracy} />

      <DistributionSection data={data} />

      <SensorSection data={data} />

      <SensorChartsRow data={data} />

      <RiskFactorSection data={data} />

      <ModelSection data={data} />

      <QualityMetadataSection data={data} metadata={metadata} />

      <PipelineSection metadataError={metadataError} />
    </AnalyticsPageShell>
  );
}
