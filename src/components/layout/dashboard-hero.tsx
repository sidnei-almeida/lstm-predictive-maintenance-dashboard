"use client";

import { streamStatusLabel } from "@/lib/maintenance/status";
import { APP_SUBTITLE, APP_TITLE } from "@/lib/navigation";
import { useMaintenanceStore } from "@/store/maintenance-store";

import { SectionHero } from "./section-hero";

export function DashboardHero() {
  const streamStatus = useMaintenanceStore((s) => s.streamStatus);
  const streamLabel = streamStatusLabel(streamStatus).toUpperCase();

  return (
    <SectionHero
      title={APP_TITLE}
      subtitle={APP_SUBTITLE}
      statusLabel={streamLabel}
      statusVariant={streamStatus}
      aria-label="Dashboard hero"
    />
  );
}
