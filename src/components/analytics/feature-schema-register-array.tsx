"use client";

import { FEATURE_SCHEMA } from "@/lib/analytics/feature-schema";
import { cn } from "@/lib/utils";

const EXCLUDED_NOTE =
  "Excluded from model: UDI, Product ID, Machine failure, TWF–RNF";

function formatUnitBracket(unit: string): string {
  if (unit === "—") return "[ — ]";
  return `[ ${unit} ]`;
}

function unitTone(unit: string): string {
  return unit === "—" ? "text-[#666666]" : "text-[#00ff00]";
}

function RegisterBlock({
  apiName,
  unit,
  preprocessing,
}: {
  apiName: string;
  unit: string;
  preprocessing: string;
}) {
  return (
    <div className="flex min-h-[4.5rem] flex-col justify-between rounded-none border border-[#333333] bg-black p-2">
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 font-mono text-[9px] font-bold leading-tight tracking-wide text-[#ffaa00]">
          {apiName}
        </span>
        <span
          className={cn(
            "shrink-0 font-mono text-[8px] font-semibold tracking-wider uppercase",
            unitTone(unit),
          )}
        >
          {formatUnitBracket(unit)}
        </span>
      </div>
      <p className="mt-2 font-mono text-[7px] leading-snug tracking-wide text-[#666666] uppercase">
        {preprocessing}
      </p>
    </div>
  );
}

function ExcludedRegisterBlock() {
  return (
    <div className="flex min-h-[4.5rem] flex-col justify-between rounded-none border border-dashed border-[#333333] bg-black p-2">
      <span className="font-mono text-[8px] font-medium tracking-[0.14em] text-[#555555] uppercase">
        Null Register
      </span>
      <p className="font-mono text-[7px] leading-relaxed tracking-wide text-[#666666] uppercase">
        {EXCLUDED_NOTE}
      </p>
    </div>
  );
}

export function FeatureSchemaRegisterArray({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid h-full min-h-0 flex-1 grid-cols-2 gap-2 auto-rows-fr",
        className,
      )}
    >
      {FEATURE_SCHEMA.map((row) => (
        <RegisterBlock
          key={row.apiName}
          apiName={row.apiName}
          unit={row.unit}
          preprocessing={row.preprocessing}
        />
      ))}
      <ExcludedRegisterBlock />
    </div>
  );
}
