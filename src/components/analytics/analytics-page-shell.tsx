"use client";

import { SectionHero } from "@/components/layout/section-hero";
import { ANALYTICS_SUBTITLE, ANALYTICS_TITLE } from "@/lib/navigation";

export function AnalyticsPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="countach-dashboard-blackout countach-page-grid flex min-h-full flex-col bg-[#000000]">
      <SectionHero
        title={ANALYTICS_TITLE}
        subtitle={ANALYTICS_SUBTITLE}
        statusLabel="DATASET"
        statusVariant="static"
        aria-label="Dataset and model analytics hero"
      />
      <div className="flex flex-col gap-[3px] p-[3px]">{children}</div>
    </div>
  );
}
