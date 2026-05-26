export const FEATURE_SCHEMA = [
  {
    apiName: "air_temperature_k",
    sourceColumn: "Air temperature [K]",
    unit: "K",
    preprocessing: "Standardized numeric feature (training scaler)",
  },
  {
    apiName: "process_temperature_k",
    sourceColumn: "Process temperature [K]",
    unit: "K",
    preprocessing: "Standardized numeric feature (training scaler)",
  },
  {
    apiName: "rotational_speed_rpm",
    sourceColumn: "Rotational speed [rpm]",
    unit: "rpm",
    preprocessing: "Standardized numeric feature (training scaler)",
  },
  {
    apiName: "torque_nm",
    sourceColumn: "Torque [Nm]",
    unit: "Nm",
    preprocessing: "Standardized numeric feature (training scaler)",
  },
  {
    apiName: "tool_wear_min",
    sourceColumn: "Tool wear [min]",
    unit: "min",
    preprocessing: "Standardized numeric feature (training scaler)",
  },
  {
    apiName: "type_l",
    sourceColumn: "Type (L)",
    unit: "—",
    preprocessing: "One-hot flag · Type L → 1",
  },
  {
    apiName: "type_m",
    sourceColumn: "Type (M)",
    unit: "—",
    preprocessing: "One-hot flag · Type M → 1 · Type H → both 0",
  },
] as const;
