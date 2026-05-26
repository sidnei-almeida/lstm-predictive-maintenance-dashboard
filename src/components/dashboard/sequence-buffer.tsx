"use client";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import { isInferenceDebugEnabled } from "@/lib/api/debug-inference";
import { SEQUENCE_LENGTH } from "@/lib/features/constants";
import { bufferCellVariant, type BufferCellVariant } from "@/lib/theme/tokens";
import { cn } from "@/lib/utils";
import {
  selectSequenceFill,
  selectSequencePhase,
  selectWindowRange,
  useMaintenanceStore,
} from "@/store/maintenance-store";

const SEGMENTS = 50;
const GRID_COLS = 10;
const GRID_ROWS = 5;

const LED_STYLES: Record<BufferCellVariant, string> = {
  empty: "supercar-led-empty",
  filled: "supercar-led-filled",
  tail: "supercar-led-tail",
  active: "supercar-led-active",
  risk: "supercar-led-risk",
};

function phaseLabel(phase: ReturnType<typeof selectSequencePhase>): string {
  if (phase === "idle") return "STBY";
  if (phase === "building") return "LOAD";
  if (phase === "inference_active") return "RUN";
  return "RDY";
}

function padCounter(n: number): string {
  return String(n).padStart(3, "0");
}

const FOOTER_META = [
  { key: "range", label: "RNG" },
  { key: "inference", label: "MODE" },
  { key: "ready", label: "API" },
] as const;

export function SequenceBuffer() {
  const fill = useMaintenanceStore(selectSequenceFill);
  const phase = useMaintenanceStore(selectSequencePhase);
  const windowRange = useMaintenanceStore(selectWindowRange);
  const inference = useMaintenanceStore((s) => s.inference);
  const lastDebug = useMaintenanceStore((s) => s.lastPredictDebug);
  const showDebug = isInferenceDebugEnabled() && lastDebug;

  const displayProb = inference?.displayProbability ?? null;
  const isFull = fill >= SEQUENCE_LENGTH;
  const phaseText = phaseLabel(phase);
  const atRisk = (displayProb ?? 0) >= 50;
  const fillPct = Math.round((fill / SEQUENCE_LENGTH) * 100);

  const footerValues = {
    range: windowRange,
    inference: phaseText,
    ready: "PREDICT",
  };

  const statusLedClass = atRisk
    ? "supercar-status-led--risk"
    : phase === "inference_active"
      ? "supercar-status-led--warn"
      : isFull || fill > 0
        ? "supercar-status-led--on"
        : "";

  return (
    <DashboardPanel
      title="SEQ REGISTER"
      description="LSTM window · 50-step temporal buffer"
      className="supercar-seq-panel h-full min-h-[300px]"
      bodyClassName="flex min-h-0 flex-1 flex-col"
    >
      {/* Recessed gauge bay */}
      <div className="supercar-gauge-bay">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={cn("supercar-status-led", statusLedClass)} aria-hidden />
            <p className="supercar-lcd-label">Window Load</p>
          </div>
          <div className="text-right">
            <span className={cn("supercar-tag", atRisk && "supercar-tag--risk")}>
              {isFull ? "RDY" : phaseText}
            </span>
            <p className="supercar-lcd-label mt-1.5">Fill</p>
            <p
              className={cn(
                "supercar-lcd-readout text-sm leading-none",
                atRisk && "supercar-lcd-readout--risk",
              )}
            >
              {fillPct}%
            </p>
          </div>
        </div>

        <p
          className={cn(
            "supercar-lcd-readout supercar-lcd-readout--hero mt-3",
            atRisk && "supercar-lcd-readout--risk",
          )}
        >
          {padCounter(fill)}
          <span className="supercar-lcd-dim"> / {padCounter(SEQUENCE_LENGTH)}</span>
        </p>

        <div className="supercar-progress-track mt-3">
          <div className="supercar-progress-fill" style={{ width: `${fillPct}%` }} />
        </div>
      </div>

      {/* Temporal segments — amber frame + VFD grid */}
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-2 pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="supercar-lcd-label">Temporal Segments</p>
          <p className="supercar-lcd-label">T-50 → T-1</p>
        </div>

        <div className="supercar-segments-frame flex flex-1 flex-col p-2.5">
          <div
            className="supercar-lcd-well flex flex-1 items-center p-2"
            role="img"
            aria-label={`Sequence buffer ${fill} of ${SEQUENCE_LENGTH} timesteps filled`}
          >
            <div
              className="relative z-[2] grid w-full gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${GRID_ROWS}, 13px)`,
              }}
            >
              {Array.from({ length: SEGMENTS }).map((_, i) => {
                const variant = bufferCellVariant(i, fill, displayProb);
                const isActiveCell = variant === "active" || variant === "risk";
                return (
                  <div
                    key={i}
                    className={cn(
                      "h-full min-h-[10px] w-full",
                      LED_STYLES[variant],
                      isActiveCell && phase === "inference_active" && "supercar-led-blink",
                    )}
                    title={`Timestep ${i + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex justify-between gap-2 px-0.5">
          <span className="supercar-lcd-label">Hist</span>
          <span className="supercar-lcd-label">Recent</span>
          <span className="supercar-lcd-label">Active</span>
        </div>
      </div>

      {/* Telemetry strip */}
      <div className="supercar-telemetry-row">
        {FOOTER_META.map(({ key, label }) => (
          <div key={key} className="supercar-telemetry-cell">
            <p className="supercar-lcd-label">{label}</p>
            <p
              className={cn(
                "supercar-telemetry-value",
                key === "inference" && phase === "inference_active" && "supercar-telemetry-value--active",
                key === "inference" &&
                  atRisk &&
                  "text-[#ff6640] shadow-[0_0_8px_rgb(255_102_64/40%)]",
              )}
            >
              {footerValues[key]}
            </p>
          </div>
        ))}
      </div>

      <div className="supercar-panel-foot">
        {showDebug ? (
          <details>
            <summary>› Diag</summary>
            <div className="mt-1 space-y-0.5 normal-case tracking-normal text-[#5a5030]">
              <p>field={lastDebug.apiFieldUsed ?? "—"}</p>
              <p>
                {lastDebug.rawProbability ?? "—"} → {lastDebug.displayProbability ?? "—"}%
              </p>
            </div>
          </details>
        ) : (
          <span className="text-[#5a5030]">› Diag</span>
        )}
        <span className="supercar-panel-foot-star" aria-hidden>
          ✦
        </span>
      </div>
    </DashboardPanel>
  );
}
