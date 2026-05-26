"use client";

import { useEffect } from "react";

import { useMaintenanceStore } from "@/store/maintenance-store";

const BOOT_STEPS: Record<string, string> = {
  shell: "Initializing dashboard shell",
  csv: "Loading pred_maint.csv for display",
  processed: "Loading X_processed.npy and y_processed.npy",
  api: "Waking LSTM inference API",
  buffer: "Preloading 50-step sequence from X_processed",
  ready: "Starting predictive maintenance monitor",
  error: "Boot failed",
};

export function MaintenanceProvider({ children }: { children: React.ReactNode }) {
  const bootReady = useMaintenanceStore((s) => s.bootReady);
  const bootPhase = useMaintenanceStore((s) => s.bootPhase);
  const bootError = useMaintenanceStore((s) => s.bootError);
  const startBoot = useMaintenanceStore((s) => s.startBoot);

  useEffect(() => {
    void startBoot();
  }, [startBoot]);

  if (!bootReady) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-[3px] bg-[#000000] p-[3px]">
        <div className="w-full max-w-md space-y-2 border border-[#333333] bg-[#000000] p-3 text-center">
          <p className="micro-label">System Boot</p>
          <h1 className="retro-header-title text-sm">Predictive Maintenance Monitor</h1>
          <p className="font-mono text-[10px] tracking-wide text-[#888888] uppercase">
            {BOOT_STEPS[bootPhase] ?? "Loading…"}
          </p>
          {bootError ? (
            <p className="border border-[#ff0000]/40 bg-[#050505] px-2 py-1.5 font-mono text-[10px] text-[#ff0000]">
              {bootError}
            </p>
          ) : (
            <div className="mx-auto h-1 w-48 border border-[#333333] bg-[#050505]">
              <div className="h-full w-1/2 animate-pulse bg-[#ffaa00]" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
