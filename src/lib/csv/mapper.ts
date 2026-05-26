import type { CsvRow, ProductType } from "@/lib/types/maintenance";

function parseType(value: string): ProductType {
  const t = value.trim().toUpperCase();
  if (t === "L" || t === "M" || t === "H") return t;
  return "M";
}

function to01(value: string): 0 | 1 {
  return String(value).trim() === "1" ? 1 : 0;
}

export function mapCsvRecord(record: Record<string, string>): CsvRow | null {
  const udi = Number(record.UDI ?? record["\ufeffUDI"]);
  if (!Number.isFinite(udi)) return null;

  const type = parseType(record.Type ?? "M");
  const air = Number(record["Air temperature [K]"]);
  const process = Number(record["Process temperature [K]"]);
  const speed = Number(record["Rotational speed [rpm]"]);
  const torque = Number(record["Torque [Nm]"]);
  const wear = Number(record["Tool wear [min]"]);

  if (![air, process, speed, torque, wear].every(Number.isFinite)) return null;

  return {
    udi,
    productId: record["Product ID"]?.trim() ?? "",
    type,
    airTemperatureK: air,
    processTemperatureK: process,
    rotationalSpeedRpm: speed,
    torqueNm: torque,
    toolWearMin: wear,
    machineFailure: to01(record["Machine failure"] ?? "0"),
    twf: to01(record.TWF ?? "0"),
    hdf: to01(record.HDF ?? "0"),
    pwf: to01(record.PWF ?? "0"),
    osf: to01(record.OSF ?? "0"),
    rnf: to01(record.RNF ?? "0"),
  };
}

export function typeToOneHot(type: ProductType): { type_l: 0 | 1; type_m: 0 | 1 } {
  if (type === "L") return { type_l: 1, type_m: 0 };
  if (type === "M") return { type_l: 0, type_m: 1 };
  return { type_l: 0, type_m: 0 };
}

export function activeFailureModes(row: Pick<CsvRow, "twf" | "hdf" | "pwf" | "osf" | "rnf">) {
  const modes: Array<"TWF" | "HDF" | "PWF" | "OSF" | "RNF"> = [];
  if (row.twf) modes.push("TWF");
  if (row.hdf) modes.push("HDF");
  if (row.pwf) modes.push("PWF");
  if (row.osf) modes.push("OSF");
  if (row.rnf) modes.push("RNF");
  return modes;
}
