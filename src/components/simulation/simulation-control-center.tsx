"use client";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEQUENCE_LENGTH, THRESHOLD_DISPLAY } from "@/lib/features/constants";
import { streamStatusLabel } from "@/lib/maintenance/status";
import type { ReplayMode } from "@/lib/replay/types";
import {
  selectReplayProgress,
  selectSequenceFill,
  useMaintenanceStore,
} from "@/store/maintenance-store";

const REPLAY_MODE_OPTIONS: { value: ReplayMode; label: string; description: string }[] = [
  {
    value: "curated_demo",
    label: "Curated Demo",
    description:
      "Normal → degradation → failure-adjacent → recovery using real historical indices",
  },
  {
    value: "sequential",
    label: "Sequential",
    description: "Linear CSV replay from row 50 for debugging and honesty checks",
  },
];

export function SimulationControlCenter() {
  const bootReady = useMaintenanceStore((s) => s.bootReady);
  const replayMode = useMaintenanceStore((s) => s.replayMode);
  const setReplayMode = useMaintenanceStore((s) => s.setReplayMode);
  const streamStatus = useMaintenanceStore((s) => s.streamStatus);
  const fill = useMaintenanceStore(selectSequenceFill);
  const progress = useMaintenanceStore(selectReplayProgress);
  const curatedSteps = useMaintenanceStore((s) => s.curatedPlan.indices.length);
  const apiHealthy = useMaintenanceStore((s) => s.apiHealthy);
  const startStream = useMaintenanceStore((s) => s.startStream);
  const pauseStream = useMaintenanceStore((s) => s.pauseStream);
  const resetStream = useMaintenanceStore((s) => s.resetStream);

  return (
    <div className="countach-page-grid flex flex-col gap-[3px] p-[3px]">
      <div className="grid grid-cols-1 gap-[3px] lg:grid-cols-2">
        <DashboardPanel title="Replay Mode" bodyClassName="space-y-4">
          <p className="text-xs text-muted-foreground">
            Curated Demo selects real dataset windows around known failures. Probabilities still
            come only from POST /predict — nothing is fabricated.
          </p>
          <div className="space-y-2">
            <p className="micro-label">Replay mode</p>
            <Select
              value={replayMode}
              onValueChange={(value) => setReplayMode(value as ReplayMode)}
              disabled={!bootReady || streamStatus === "live"}
            >
              <SelectTrigger size="sm" className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPLAY_MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {REPLAY_MODE_OPTIONS.find((o) => o.value === replayMode)?.description}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="micro-label">Curated steps</dt>
              <dd className="font-mono font-medium">{curatedSteps.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="micro-label">Progress</dt>
              <dd className="font-mono font-medium">{progress}</dd>
            </div>
          </dl>
        </DashboardPanel>

        <DashboardPanel title="Stream Replay" bodyClassName="space-y-3">
          <p className="text-xs text-muted-foreground">
            pred_maint.csv for display · X_processed.npy for LSTM payload · y_processed for ground
            truth
          </p>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="micro-label">Stream</dt>
              <dd className="font-medium">{streamStatusLabel(streamStatus)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="micro-label">Sequence buffer</dt>
              <dd className="font-mono font-medium">
                {fill} / {SEQUENCE_LENGTH}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="micro-label">API</dt>
              <dd className="font-medium">{apiHealthy ? "Online" : "Offline"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="micro-label">Threshold</dt>
              <dd className="font-mono font-medium">{THRESHOLD_DISPLAY}%</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" disabled={!bootReady} onClick={startStream}>
              Start
            </Button>
            <Button size="sm" variant="outline" disabled={!bootReady} onClick={pauseStream}>
              Pause
            </Button>
            <Button size="sm" variant="outline" disabled={!bootReady} onClick={resetStream}>
              Reset
            </Button>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel title="Configuration summary" className="xl:col-span-2" bodyClassName="text-xs text-muted-foreground">
        <p>
          Default replay: <span className="font-medium text-foreground">Curated Demo</span>. Feature
          order: air/process temperature, RPM, torque, tool wear, type_l, type_m. Sequence POST /predict
          uses 50×7 scaled vectors from X_processed only.
        </p>
      </DashboardPanel>
    </div>
  );
}
