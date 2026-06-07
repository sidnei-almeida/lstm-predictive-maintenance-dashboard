import { DashboardHero } from "@/components/layout/dashboard-hero";

import { AssetHealthOverview } from "./asset-health-overview";
import { DashboardPanelTabs } from "./dashboard-panel-tabs";
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

        <DashboardPanelTabs
          ariaLabel="Main operations"
          tabs={[
            { id: "health", label: "Asset Health", panel: <AssetHealthOverview /> },
            { id: "machines", label: "Machines", panel: <MachineCondition /> },
            { id: "maintenance", label: "Maintenance", panel: <MaintenanceDecision /> },
          ]}
        />

        <DashboardPanelTabs
          ariaLabel="Secondary analytics"
          tabs={[
            { id: "trend", label: "Trend", panel: <FailureProbabilityTrend /> },
            { id: "buffer", label: "Buffer", panel: <SequenceBuffer /> },
            { id: "risk", label: "Risk", panel: <RiskDrivers /> },
          ]}
        />

        <EventLog />
      </div>
    </div>
  );
}
