import { PUMP_THRESHOLD_ADC_MAX } from "@/lib/bluetooth/commands";

// The firmware expresses pump thresholds as raw sensor ADC values (0–4095)
// spanning the full water column, while the UI sliders are 0–100 within
// their half of the column: LOW travels the bottom (red) half, HIGH the top
// (green) half (see constants.ts zone layout). So LOW maps onto the lower
// half of the ADC range and HIGH onto the upper half.

/** Map a LOW slider level (0–100 in the bottom zone) to ADC 0–~2048. */
export function triggerLevelLowToAdc(level: number): number {
  return Math.round((level / 100) * 0.5 * PUMP_THRESHOLD_ADC_MAX);
}

/** Map a HIGH slider level (0–100 in the top zone) to ADC ~2048–4095. */
export function triggerLevelHighToAdc(level: number): number {
  return Math.round((0.5 + (level / 100) * 0.5) * PUMP_THRESHOLD_ADC_MAX);
}
