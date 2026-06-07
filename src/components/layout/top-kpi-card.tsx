import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type TopKpiTone = "default" | "gold" | "success" | "danger" | "muted";

/** VFD terminal value styles — dashboard KPI row */
export type VfdValueKind = "status-positive" | "status-negative" | "numeric" | "dim";

export function TopKpiCard({
  label,
  value,
  tone = "default",
  vfdValueKind,
  className,
}: {
  label: string;
  value: ReactNode;
  tone?: TopKpiTone;
  vfdValueKind?: VfdValueKind;
  className?: string;
}) {
  if (vfdValueKind) {
    return (
      <div className={cn("vfd-kpi-card", className)}>
        <p className="vfd-kpi-label">{label}</p>
        <p className={cn("vfd-kpi-value", `vfd-kpi-value--${vfdValueKind}`)}>{value}</p>
      </div>
    );
  }

  return (
    <div className="top-kpi-card">
      <p className="top-kpi-label">{label}</p>
      <p
        className={cn(
          "top-kpi-value",
          tone === "gold" && "top-kpi-value--gold",
          tone === "success" && "top-kpi-value--success",
          tone === "danger" && "top-kpi-value--danger",
          tone === "muted" && "top-kpi-value--muted",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function TopKpiGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid grid-cols-2 gap-2", className)}>{children}</div>;
}
