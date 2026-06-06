export function formatMetricPct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatMetricFloat(value: number, digits = 3): string {
  return value.toFixed(digits);
}
