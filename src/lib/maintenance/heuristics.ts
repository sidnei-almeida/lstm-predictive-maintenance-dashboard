import type { MachinePacket, RiskDriverRow } from "@/lib/types/maintenance";

export function temperatureGap(packet: MachinePacket): number {
  return packet.sensors.process_temperature_k - packet.sensors.air_temperature_k;
}

export function toolWearState(wear: number): "Normal" | "Elevated" | "High" {
  if (wear >= 180) return "High";
  if (wear >= 100) return "Elevated";
  return "Normal";
}

export function highestStressFactor(packet: MachinePacket): string {
  const wear = packet.sensors.tool_wear_min;
  const torque = packet.sensors.torque_nm;
  const gap = temperatureGap(packet);

  if (wear >= 150) return "Tool Wear";
  if (torque >= 55) return "Torque Load";
  if (gap >= 14) return "Temperature Gap";
  return "Stable";
}

export function mostUnstableReading(
  recent: MachinePacket[],
  current: MachinePacket,
): string {
  if (recent.length < 2) return "—";

  const keys = [
    "air_temperature_k",
    "process_temperature_k",
    "rotational_speed_rpm",
    "torque_nm",
    "tool_wear_min",
  ] as const;

  const labels: Record<(typeof keys)[number], string> = {
    air_temperature_k: "Air Temperature",
    process_temperature_k: "Process Temperature",
    rotational_speed_rpm: "Rotational Speed",
    torque_nm: "Torque",
    tool_wear_min: "Tool Wear",
  };

  let maxKey: (typeof keys)[number] = keys[0];
  let maxDelta = 0;

  const prev = recent[recent.length - 2];
  for (const key of keys) {
    const delta = Math.abs(current.sensors[key] - prev.sensors[key]);
    if (delta > maxDelta) {
      maxDelta = delta;
      maxKey = key;
    }
  }

  return maxDelta > 0 ? labels[maxKey] : "—";
}

function levelFromScore(score: number): "Low" | "Moderate" | "High" {
  if (score >= 0.65) return "High";
  if (score >= 0.35) return "Moderate";
  return "Low";
}

export function computeRiskDrivers(packet: MachinePacket | null): RiskDriverRow[] {
  if (!packet) {
    return [
      { label: "Tool Wear", level: "—", detail: "Awaiting packet" },
      { label: "Torque Load", level: "—", detail: "Awaiting packet" },
      { label: "Temperature Gap", level: "—", detail: "Awaiting packet" },
      { label: "Rotational Stress", level: "—", detail: "Awaiting packet" },
      { label: "Product Type", level: "—", detail: "Awaiting packet" },
    ];
  }

  const wear = packet.sensors.tool_wear_min;
  const torque = packet.sensors.torque_nm;
  const gap = temperatureGap(packet);
  const rpm = packet.sensors.rotational_speed_rpm;

  const wearScore = Math.min(wear / 250, 1);
  const torqueScore = Math.min(torque / 70, 1);
  const gapScore = Math.min(gap / 18, 1);
  const rpmScore = rpm > 2000 ? Math.min((rpm - 2000) / 800, 1) : Math.min((1500 - rpm) / 500, 1) * 0.5;

  const rows: RiskDriverRow[] = [
    {
      label: "Tool Wear",
      level: levelFromScore(wearScore),
      detail: `${wear.toFixed(0)} min`,
      score: wearScore,
    },
    {
      label: "Torque Load",
      level: levelFromScore(torqueScore),
      detail: `${torque.toFixed(1)} Nm`,
      score: torqueScore,
    },
    {
      label: "Temperature Gap",
      level: levelFromScore(gapScore),
      detail: `${gap.toFixed(1)} K`,
      score: gapScore,
    },
    {
      label: "Rotational Stress",
      level: levelFromScore(rpmScore),
      detail: `${rpm.toFixed(0)} rpm`,
      score: rpmScore,
    },
    {
      label: "Product Type",
      level: "Low",
      detail: `Line ${packet.productType}`,
      score: 0.2,
    },
  ];

  const order: Record<RiskDriverRow["level"], number> = {
    High: 0,
    Moderate: 1,
    Low: 2,
    "—": 3,
  };

  return rows.sort((a, b) => order[a.level] - order[b.level]);
}

export function conditionDriverFromPacket(packet: MachinePacket): string {
  const factor = highestStressFactor(packet);
  if (packet.groundTruth.failureModes.length > 0) {
    return `${factor} · ${packet.groundTruth.failureModes.join(", ")}`;
  }
  return factor;
}
