"use client";

import { usePathname } from "next/navigation";

import { APP_SUBTITLE, APP_TITLE, CONTEXT_LABELS, ROUTES_WITH_SECTION_HERO } from "@/lib/navigation";
import { streamStatusLabel } from "@/lib/maintenance/status";
import { cn } from "@/lib/utils";
import { useMaintenanceStore } from "@/store/maintenance-store";

import { LiveClock } from "./live-clock";

export function Topbar() {
  const pathname = usePathname();
  const hasSectionHero =
    ROUTES_WITH_SECTION_HERO.includes(pathname as (typeof ROUTES_WITH_SECTION_HERO)[number]);
  const apiHealthy = useMaintenanceStore((s) => s.apiHealthy);
  const apiUsesSimulated = useMaintenanceStore((s) => s.apiUsesSimulated);
  const streamStatus = useMaintenanceStore((s) => s.streamStatus);
  const startStream = useMaintenanceStore((s) => s.startStream);
  const pauseStream = useMaintenanceStore((s) => s.pauseStream);
  const resetStream = useMaintenanceStore((s) => s.resetStream);
  const injectFailureRisk = useMaintenanceStore((s) => s.injectFailureRisk);
  const bootReady = useMaintenanceStore((s) => s.bootReady);

  const apiLabel = !apiHealthy
    ? "API Offline"
    : apiUsesSimulated
      ? "API Simulated"
      : "API LSTM Live";

  const streamLabel = streamStatusLabel(streamStatus).toUpperCase();

  return (
    <header
      className={cn(
        "shrink-0",
        !hasSectionHero && "border-b border-[#333333]",
      )}
    >
      <div className="countach-topbar">
        <div className="countach-topbar-context">
          {CONTEXT_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="countach-topbar-cluster">
          <LiveClock className="countach-topbar-clock" />

          <span className="countach-topbar-readout">
            <span
              className={cn(
                "countach-topbar-led",
                apiHealthy ? "countach-topbar-led--on" : "countach-topbar-led--off",
              )}
              aria-hidden
            />
            {apiLabel.toUpperCase()}
          </span>

          <span className="countach-topbar-readout">
            <span
              className={cn(
                "countach-topbar-led",
                streamStatus === "live"
                  ? "countach-topbar-led--on"
                  : streamStatus === "paused"
                    ? "countach-topbar-led--warn"
                    : "countach-topbar-led--off",
              )}
              aria-hidden
            />
            STREAM {streamLabel}
          </span>

          <div className="countach-topbar-controls" role="toolbar" aria-label="Stream controls">
            <button
              type="button"
              disabled={!bootReady}
              onClick={startStream}
              className="countach-dash-btn countach-dash-btn--run"
            >
              <span className="countach-dash-btn-glyph" aria-hidden>
                |&gt;
              </span>
              Start
            </button>
            <button
              type="button"
              disabled={!bootReady}
              onClick={pauseStream}
              className="countach-dash-btn"
            >
              <span className="countach-dash-btn-glyph" aria-hidden>
                ||
              </span>
              Pause
            </button>
            <button
              type="button"
              disabled={!bootReady}
              onClick={resetStream}
              className="countach-dash-btn"
            >
              <span className="countach-dash-btn-glyph" aria-hidden>
                []
              </span>
              Reset
            </button>
            <button
              type="button"
              disabled={!bootReady}
              onClick={injectFailureRisk}
              className="countach-dash-btn countach-dash-btn--danger"
            >
              <span className="countach-dash-btn-glyph" aria-hidden>
                !
              </span>
              Inject
            </button>
          </div>
        </div>
      </div>

      {!hasSectionHero ? (
        <div className="countach-header-title-strip px-3 py-2">
          <h1 className="retro-header-title">{APP_TITLE}</h1>
          <p className="retro-header-sub mt-0.5">{APP_SUBTITLE}</p>
        </div>
      ) : null}
    </header>
  );
}
