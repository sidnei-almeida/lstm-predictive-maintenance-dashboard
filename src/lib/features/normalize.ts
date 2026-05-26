import type { CsvRow, FeatureVector, MachinePacket } from "@/lib/types/maintenance";

import { typeToOneHot } from "../csv/mapper";

/** Display-only packet from raw CSV row + aligned X_processed vector for LSTM input. */
export function csvRowToPacket(
  row: CsvRow,
  packetId: number,
  timestamp: Date,
  modelVector: FeatureVector,
  rowIndex?: number,
): MachinePacket {
  const { type_l, type_m } = typeToOneHot(row.type);

  return {
    packetId,
    rowIndex,
    udi: row.udi,
    productId: row.productId,
    productType: row.type,
    timestamp,
    sensors: {
      air_temperature_k: row.airTemperatureK,
      process_temperature_k: row.processTemperatureK,
      rotational_speed_rpm: row.rotationalSpeedRpm,
      torque_nm: row.torqueNm,
      tool_wear_min: row.toolWearMin,
      type_l,
      type_m,
    },
    groundTruth: {
      machineFailure: row.machineFailure,
      failureModes: (() => {
        const modes: MachinePacket["groundTruth"]["failureModes"] = [];
        if (row.twf) modes.push("TWF");
        if (row.hdf) modes.push("HDF");
        if (row.pwf) modes.push("PWF");
        if (row.osf) modes.push("OSF");
        if (row.rnf) modes.push("RNF");
        return modes;
      })(),
    },
    modelVector,
  };
}
