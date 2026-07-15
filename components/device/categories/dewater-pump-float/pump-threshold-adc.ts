import { PUMP_THRESHOLD_ADC_MAX } from "@/lib/bluetooth/commands";

// Firmware thresholds are raw ADC values (0–4095) over the full column, while
// UI sliders are 0–100 within their own half (LOW = bottom/red, HIGH =
// top/green, see constants.ts). So LOW maps to the lower ADC half, HIGH to the upper.

/** Map a LOW slider level (0–100 in the bottom zone) to ADC 0–~2048. */
export function triggerLevelLowToAdc(level: number): number {
  return Math.round((level / 100) * 0.5 * PUMP_THRESHOLD_ADC_MAX);
}

/** Map a HIGH slider level (0–100 in the top zone) to ADC ~2048–4095. */
export function triggerLevelHighToAdc(level: number): number {
  return Math.round((0.5 + (level / 100) * 0.5) * PUMP_THRESHOLD_ADC_MAX);
}
