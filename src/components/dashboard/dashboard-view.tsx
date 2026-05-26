import { DashboardHero } from "@/components/layout/dashboard-hero";

import { AssetHealthOverview } from "./asset-health-overview";
import { EventLog } from "./event-log";
import { FailureProbabilityTrend } from "./failure-probability-trend";
import { KpiRow } from "./kpi-row";
import { MachineCondition } from "./machine-condition";
import { MaintenanceDecision } from "./maintenance-decision";
import { PipelineStrip } from "./pipeline-strip";
import { RiskDrivers } from "./risk-drivers";
import { SequenceBuffer } from "./sequence-buffer";

export function DashboardView() {
  return (
    <div className="countach-dashboard-blackout countach-page-grid flex min-h-full flex-col bg-[#000000]">
      <DashboardHero />
      <div className="flex flex-col gap-[3px] p-[3px]">
      <KpiRow />
      <PipelineStrip />

      <section aria-label="Main operations">
        <div className="grid grid-cols-1 gap-[3px] lg:grid-cols-3">
          <AssetHealthOverview />
          <MachineCondition />
          <MaintenanceDecision />
        </div>
      </section>

      <section aria-label="Secondary analytics">
        <div className="grid grid-cols-1 gap-[3px] lg:grid-cols-3">
          <FailureProbabilityTrend />
          <SequenceBuffer />
          <RiskDrivers />
        </div>
      </section>

      <EventLog />
      </div>
    </div>
  );
}
