"use client";

import { SectionHero } from "@/components/layout/section-hero";
import type { SectionHeroStatusVariant } from "@/components/layout/section-hero";
import { ALERTS_SUBTITLE, ALERTS_TITLE } from "@/lib/navigation";
import { streamStatusLabel } from "@/lib/maintenance/status";
import { useMaintenanceStore } from "@/store/maintenance-store";

function alertsStatusVariant(
  streamStatus: string,
): SectionHeroStatusVariant {
  if (streamStatus === "live") return "live";
  if (streamStatus === "paused") return "paused";
  return "idle";
}

export function AlertsPageShell({ children }: { children: React.ReactNode }) {
  const streamStatus = useMaintenanceStore((s) => s.streamStatus);
  const statusVariant = alertsStatusVariant(streamStatus);

  return (
    <div className="countach-dashboard-blackout countach-page-grid flex min-h-full flex-col bg-[#000000]">
      <SectionHero
        title={ALERTS_TITLE}
        subtitle={ALERTS_SUBTITLE}
        statusLabel={streamStatusLabel(streamStatus).toUpperCase()}
        statusVariant={statusVariant}
        aria-label="Alerts and prediction history hero"
      />
      <div className="flex flex-col gap-[3px] p-[3px]">{children}</div>
    </div>
  );
}
