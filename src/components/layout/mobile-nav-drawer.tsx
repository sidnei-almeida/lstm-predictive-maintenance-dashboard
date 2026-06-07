"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { PmMonitorLogo } from "@/components/layout/pm-monitor-logo";
import { LiveClock } from "@/components/layout/live-clock";
import { APP_TITLE, NAV_ITEMS } from "@/lib/navigation";
import { streamStatusLabel } from "@/lib/maintenance/status";
import { cn } from "@/lib/utils";
import { useMaintenanceStore } from "@/store/maintenance-store";

const DRAWER_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/analytics": "Dataset & Models",
  "/alerts": "Alerts / History",
  "/simulation": "Simulation",
};

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const pathname = usePathname();
  const drawerRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);

  const apiHealthy = useMaintenanceStore((s) => s.apiHealthy);
  const streamStatus = useMaintenanceStore((s) => s.streamStatus);
  const startStream = useMaintenanceStore((s) => s.startStream);
  const pauseStream = useMaintenanceStore((s) => s.pauseStream);
  const resetStream = useMaintenanceStore((s) => s.resetStream);
  const injectFailureRisk = useMaintenanceStore((s) => s.injectFailureRisk);
  const bootReady = useMaintenanceStore((s) => s.bootReady);

  const streamLabel = streamStatusLabel(streamStatus).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="countach-mobile-drawer-root" role="presentation">
      <button
        type="button"
        className="countach-mobile-drawer-backdrop"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        ref={drawerRef}
        className="countach-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          const end = e.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start != null && end != null && start - end > 60) {
            onClose();
          }
        }}
      >
        <div className="countach-mobile-drawer__header">
          <PmMonitorLogo className="h-8 w-8" title="PM Monitor" />
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffaa00]">
              PM Monitor
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wide text-[#666666]">
              {APP_TITLE}
            </p>
          </div>
          <button
            type="button"
            className="countach-mobile-drawer__close"
            aria-label="Close navigation"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="countach-mobile-drawer__status">
          <LiveClock className="countach-topbar-clock w-full justify-center" />
          <p className="font-mono text-[10px] uppercase tracking-wide text-[#888888]">
            API {apiHealthy ? "Online" : "Offline"} · Stream {streamLabel}
          </p>
        </div>

        <nav className="countach-mobile-drawer__nav" aria-label="Sections">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "countach-mobile-drawer__link",
                  isActive && "countach-mobile-drawer__link--active",
                )}
                onClick={onClose}
              >
                {DRAWER_LABELS[item.href] ?? item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="countach-mobile-drawer__controls"
          role="toolbar"
          aria-label="Stream controls"
        >
          <button
            type="button"
            disabled={!bootReady}
            onClick={startStream}
            className="countach-dash-btn countach-dash-btn--run min-h-11 flex-1"
          >
            Start
          </button>
          <button
            type="button"
            disabled={!bootReady}
            onClick={pauseStream}
            className="countach-dash-btn min-h-11 flex-1"
          >
            Pause
          </button>
          <button
            type="button"
            disabled={!bootReady}
            onClick={resetStream}
            className="countach-dash-btn min-h-11 flex-1"
          >
            Reset
          </button>
          <button
            type="button"
            disabled={!bootReady}
            onClick={injectFailureRisk}
            className="countach-dash-btn countach-dash-btn--danger min-h-11 flex-1"
          >
            Inject
          </button>
        </div>
      </aside>
    </div>
  );
}
