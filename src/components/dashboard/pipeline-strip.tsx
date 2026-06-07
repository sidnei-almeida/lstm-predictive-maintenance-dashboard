"use client";

import { ChevronRight } from "lucide-react";

import { SEQUENCE_LENGTH } from "@/lib/features/constants";
import {
  formatDisplayPercentLabel,
  recommendedAction,
} from "@/lib/maintenance/status";
import { selectSequenceFill, useMaintenanceStore } from "@/store/maintenance-store";

const STAGE_TITLES = [
  "Historical Machine Log",
  "Live Replay Engine",
  "Rolling LSTM Window",
  "Failure Probability",
  "Maintenance Decision",
] as const;

export function PipelineStrip() {
  const rows = useMaintenanceStore((s) => s.rows);
  const fill = useMaintenanceStore(selectSequenceFill);
  const inference = useMaintenanceStore((s) => s.inference);
  const packetsProcessed = useMaintenanceStore((s) => s.packetsProcessed);
  const replayMode = useMaintenanceStore((s) => s.replayMode);

  const subtitles = [
    rows.length > 0 ? `${rows.length.toLocaleString()} rows` : "Loading…",
    rows.length > 0
      ? `Pkt ${packetsProcessed} · ${replayMode === "curated_demo" ? "Curated" : "Seq"}`
      : "Simulated stream",
    `${fill}/${SEQUENCE_LENGTH}`,
    inference
      ? formatDisplayPercentLabel(inference.displayProbability, inference.rawProbability)
      : "—",
    inference ? recommendedAction(inference.prediction) : "Awaiting",
  ];

  return (
    <div className="countach-pipeline-strip px-2 py-1.5">
      <p className="card-title mb-1.5">Maintenance Pipeline</p>
      <div className="countach-pipeline-strip__flow flex flex-nowrap items-stretch gap-1">
        {STAGE_TITLES.map((title, index) => (
          <div
            key={title}
            className="countach-pipeline-strip__step flex min-w-0 flex-1 items-center gap-0.5"
          >
            <div className="retro-pipeline-cell min-w-0 flex-1">
              <p className="micro-label micro-label-xs">{title}</p>
              <p className="metadata-text mt-0.5 truncate retro-txt-primary">{subtitles[index]}</p>
            </div>
            {index < STAGE_TITLES.length - 1 ? (
              <ChevronRight
                className="countach-pipeline-strip__chevron size-2.5 shrink-0 retro-txt-gold"
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
