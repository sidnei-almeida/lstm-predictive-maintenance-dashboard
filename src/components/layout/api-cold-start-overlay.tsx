"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type ColdStartBootPhase =
  | "shell"
  | "csv"
  | "processed"
  | "api"
  | "buffer"
  | "ready"
  | "error";

type StepStatus = "pending" | "in_progress" | "complete";

type InitStep = {
  id: string;
  label: string;
  status: StepStatus;
};

const PHASE_RANK: Record<ColdStartBootPhase, number> = {
  shell: 0,
  csv: 1,
  processed: 2,
  buffer: 3,
  api: 4,
  ready: 5,
  error: -1,
};

function stepStatus(phase: ColdStartBootPhase, activeAt: number, completeFrom: number): StepStatus {
  const rank = PHASE_RANK[phase];
  if (rank < 0) return "pending";
  if (rank >= completeFrom) return "complete";
  if (rank >= activeAt) return "in_progress";
  return "pending";
}

function buildInitSteps(phase: ColdStartBootPhase): InitStep[] {
  return [
    {
      id: "init",
      label: "SYSTEM INITIALIZATION SEQUENCE",
      status: stepStatus(phase, 0, 1),
    },
    {
      id: "api",
      label: "WAKING UP PREDICTIVE MODEL API",
      status: stepStatus(phase, 4, 5),
    },
    {
      id: "stream",
      label: "ESTABLISHING REAL-TIME STREAM LINK",
      status: stepStatus(phase, 3, 4),
    },
    {
      id: "schema",
      label: "VALIDATING FEATURE SCHEMA",
      status: stepStatus(phase, 2, 3),
    },
    {
      id: "tiling",
      label: "PREPARING DASHBOARD TILING MANAGER",
      status: stepStatus(phase, 0, 2),
    },
  ];
}

function statusSuffix(status: StepStatus): string {
  if (status === "in_progress") return "IN_PROGRESS [PULSE AMBER]";
  if (status === "complete") return "COMPLETE";
  return "PENDING";
}

type ApiColdStartOverlayProps = {
  bootPhase: ColdStartBootPhase;
  bootError: string | null;
  fadeOut?: boolean;
};

export function ApiColdStartOverlay({
  bootPhase,
  bootError,
  fadeOut = false,
}: ApiColdStartOverlayProps) {
  const steps = useMemo(() => buildInitSteps(bootPhase), [bootPhase]);
  const [typedLines, setTypedLines] = useState(0);

  useEffect(() => {
    setTypedLines(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= steps.length; i += 1) {
      timers.push(
        setTimeout(() => {
          setTypedLines(i);
        }, 120 * i),
      );
    }
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [steps.length, bootPhase]);

  return (
    <div
      className={cn(
        "countach-cold-start-overlay fixed inset-0 z-[200] flex items-center justify-center bg-[#000000] p-4 transition-opacity duration-500",
        fadeOut && "pointer-events-none opacity-0",
      )}
      role="alertdialog"
      aria-modal="true"
      aria-busy={!fadeOut && bootPhase !== "error"}
      aria-label="System initialization"
    >
      <div className="countach-cold-start-bezel w-full max-w-lg border border-[#333333] bg-[#000000] px-5 py-6">
        <p className="font-mono text-[10px] font-medium uppercase leading-tight tracking-[0.28em] text-[#888888]">
          Predictive Maintenance Monitor
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase leading-tight tracking-[0.18em] text-[#666666]">
          Tactical Terminal · Cold Start Manager
        </p>

        <div className="mt-6 flex justify-center">
          <div
            className="countach-vfd-gauge flex w-full max-w-md gap-[3px]"
            aria-hidden
          >
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="countach-vfd-gauge__segment h-3 min-w-0 flex-1"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>

        <div className="countach-cold-start-log mt-6 space-y-1.5 font-mono text-[9px] uppercase leading-tight">
          {steps.map((step, index) => {
            const visible = index < typedLines;
            const suffix = statusSuffix(step.status);
            return (
              <p
                key={step.id}
                className={cn(
                  "countach-cold-start-line text-left",
                  visible ? "opacity-100" : "opacity-0",
                  step.status === "pending" && "text-[#666666]",
                  step.status === "in_progress" && "animate-pulse text-[#ffaa00]",
                  step.status === "complete" && "text-[#00ff00]",
                )}
              >
                <span className="text-[#888888]">{">"}</span>{" "}
                {step.id === "init" ? (
                  <span>{step.label}...</span>
                ) : (
                  <span>
                    [ {step.label} ] - {suffix}
                  </span>
                )}
              </p>
            );
          })}
        </div>

        {bootError ? (
          <p className="mt-4 border border-[#ff0000]/50 bg-[#050505] px-2 py-1.5 font-mono text-[9px] uppercase leading-tight text-[#ff0000]">
            {">"} BOOT_FAULT: {bootError}
          </p>
        ) : null}

        <p className="mt-6 border-t border-[#222222] pt-3 text-center font-mono text-[8px] uppercase leading-tight tracking-[0.12em] text-[#666666]">
          Estimated wait: ~30-60 seconds. Please stand by for telemetry link.
        </p>
      </div>
    </div>
  );
}
