"use client";

import { SEQUENCE_LENGTH } from "@/lib/features/constants";
import { cn } from "@/lib/utils";

function SpecBox({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[4.75rem] flex-col justify-between border border-[#333333] bg-black p-2",
        className,
      )}
    >
      <span className="font-mono text-[8px] font-medium tracking-[0.16em] text-[#888888] uppercase">
        {label}
      </span>
      <div className="mt-2 flex flex-1 flex-col items-end justify-end gap-1.5 self-stretch">
        {children}
      </div>
    </div>
  );
}

export function ModelOverviewSpecPlate({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid min-h-[15rem] grid-cols-2 gap-2 md:h-full md:flex-1",
        className,
      )}
    >
      <SpecBox label="Model Type">
        <span className="font-mono text-sm font-bold tracking-wide text-[#ffaa00] uppercase">
          LSTM
        </span>
      </SpecBox>

      <SpecBox label="Task">
        <span className="text-right font-mono text-[10px] font-semibold leading-tight tracking-wide text-[#ffaa00] uppercase">
          Binary
          <br />
          Machine Failure
        </span>
      </SpecBox>

      <SpecBox label="Input">
        <span className="font-mono text-lg font-bold tracking-wider text-[#666666]">
          [ {SEQUENCE_LENGTH}&nbsp;&times;&nbsp;7 ]
        </span>
        <span className="font-mono text-[7px] tracking-[0.12em] text-[#555555] uppercase">
          timesteps
        </span>
      </SpecBox>

      <SpecBox label="Output">
        <span className="text-right font-mono text-[10px] font-semibold leading-tight tracking-wide text-[#ffaa00] uppercase">
          Failure
          <br />
          Probability
        </span>
      </SpecBox>

      <SpecBox label="Threshold">
        <span className="font-mono text-base font-bold tabular-nums text-[#ffaa00]">0.5</span>
        <div
          className="h-[2px] w-full border border-[#333333] bg-[#111111]"
          role="meter"
          aria-valuenow={50}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Decision threshold at 50 percent"
        >
          <div className="h-full w-1/2 bg-[#ffaa00]" />
        </div>
      </SpecBox>

      <SpecBox label="Inference">
        <div className="flex items-center justify-end gap-2">
          <span
            className="model-spec-plate-led size-1.5 shrink-0 bg-[#00ff00]"
            aria-hidden
          />
          <span className="font-mono text-[11px] font-bold tracking-wide text-[#ffaa00] uppercase">
            FastAPI REST
          </span>
        </div>
      </SpecBox>
    </div>
  );
}
