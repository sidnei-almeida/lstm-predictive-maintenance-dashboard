export const SEQUENCE_LENGTH = 50;
export const FEATURE_COUNT = 7;
export const THRESHOLD_RAW = 0.5;
export const THRESHOLD_DISPLAY = 50;
export const WATCH_THRESHOLD = 0.4;

export const FEATURE_ORDER = [
  "air_temperature_k",
  "process_temperature_k",
  "rotational_speed_rpm",
  "torque_nm",
  "tool_wear_min",
  "type_l",
  "type_m",
] as const;
