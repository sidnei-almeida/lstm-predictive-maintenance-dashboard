"use client";

import { DashboardPanel } from "@/components/layout/dashboard-panel";
import {
  highestStressFactor,
  mostUnstableReading,
  toolWearState,
  useMaintenanceStore,
} from "@/store/maintenance-store";
import { cn } from "@/lib/utils";

const SENSOR_ROWS = [
  { key: "air_temperature_k" as const, label: "Air Temperature", unit: "K" },
  { key: "process_temperature_k" as const, label: "Process Temperature", unit: "K" },
  { key: "rotational_speed_rpm" as const, label: "Rotational Speed", unit: "rpm" },
  { key: "torque_nm" as const, label: "Torque", unit: "Nm" },
  { key: "tool_wear_min" as const, label: "Tool Wear", unit: "min" },
] as const;

function formatValue(key: string, value: number): string {
  if (key === "rotational_speed_rpm") return value.toFixed(0);
  if (key === "tool_wear_min") return value.toFixed(0);
  return value.toFixed(1);
}

function summaryValueClass(label: string, value: string): string {
  if (value === "—") return "machine-condition-summary-value--dim";

  const v = value.toLowerCase();
  const l = label.toLowerCase();

  if (v.includes("high") || v.includes("unstable")) {
    return "machine-condition-summary-value--danger";
  }
  if (
    v.includes("elevated") ||
    v.includes("watch") ||
    l === "unstable" ||
    (l === "highest stress" && v !== "stable")
  ) {
    return "machine-condition-summary-value--amber";
  }
  if (v === "stable" || v === "normal") {
    return "machine-condition-summary-value--green";
  }

  return "machine-condition-summary-value--amber";
}

export function MachineCondition() {
  const packet = useMaintenanceStore((s) => s.latestPacket);
  const recentPackets = useMaintenanceStore((s) => s.bufferPackets);

  const summaryRows = [
    {
      label: "Highest stress",
      value: packet ? highestStressFactor(packet) : "—",
    },
    {
      label: "Tool wear",
      value: packet ? toolWearState(packet.sensors.tool_wear_min) : "—",
    },
    {
      label: "Product",
      value: packet?.productType ?? "—",
    },
    {
      label: "Unstable",
      value: packet ? mostUnstableReading(recentPackets, packet) : "—",
    },
  ];

  return (
    <DashboardPanel
      title="Machine Condition"
      description="Live sensor readout"
      className="machine-condition-panel h-full min-h-[260px]"
      bodyClassName="machine-condition-body flex min-h-0 flex-1 flex-col p-0"
    >
      <ul className="machine-condition-sensor-grid grid flex-1 grid-cols-2 gap-2 p-3">
        {SENSOR_ROWS.map((row) => {
          const value = packet?.sensors[row.key];
          return (
            <li key={row.key} className="machine-condition-module flex flex-col gap-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="machine-condition-sensor-label">{row.label}</p>
                  <p className="machine-condition-sensor-unit">{row.unit}</p>
                </div>
                <span
                  className={cn(
                    "machine-condition-led mt-0.5 size-1 shrink-0",
                    packet ? "machine-condition-led--on" : "machine-condition-led--off",
                  )}
                  aria-hidden
                />
              </div>
              <p
                className={cn(
                  "machine-condition-sensor-value text-right",
                  value == null && "machine-condition-sensor-value--dim",
                )}
              >
                {value != null ? formatValue(row.key, value) : "—"}
              </p>
            </li>
          );
        })}
        <li className="machine-condition-module flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="machine-condition-sensor-label">Product Type</p>
              <p className="machine-condition-sensor-unit">Line</p>
            </div>
            <span
              className={cn(
                "machine-condition-led mt-0.5 size-1 shrink-0",
                packet ? "machine-condition-led--on" : "machine-condition-led--off",
              )}
              aria-hidden
            />
          </div>
          <p
            className={cn(
              "machine-condition-sensor-value text-right",
              !packet?.productType && "machine-condition-sensor-value--dim",
            )}
          >
            {packet?.productType ?? "—"}
          </p>
        </li>
      </ul>

      <footer className="machine-condition-summary shrink-0 border-t border-[#222222] px-3 py-3">
        <p className="retro-label">Condition Summary</p>
        <dl className="machine-condition-summary-grid mt-2.5 grid grid-cols-2 gap-x-4 gap-y-3">
          {summaryRows.map((row) => (
            <div key={row.label} className="machine-condition-summary-item min-w-0">
              <dt className="machine-condition-summary-label">{row.label}</dt>
              <dd
                className={cn(
                  "machine-condition-summary-value",
                  summaryValueClass(row.label, row.value),
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </footer>
    </DashboardPanel>
  );
}
