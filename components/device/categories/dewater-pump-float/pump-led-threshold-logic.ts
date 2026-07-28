import { WATER_LED_SEGMENT_COUNT } from "./constants";

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

/** Segment index where the dead band starts (bottom of grey zone). */
export function getLowThresholdBoundaryIndex(triggerLevelLow: number) {
  const low = clampPercent(triggerLevelLow);
  return Math.round((low / 100) * WATER_LED_SEGMENT_COUNT);
}

/** First segment index above the dead band (bottom of lit green zone). */
export function getHighThresholdBoundaryIndex(triggerLevelHigh: number) {
  const high = clampPercent(triggerLevelHigh);
  return Math.round((high / 100) * WATER_LED_SEGMENT_COUNT);
}

/** Topmost lit segment index for a 0–100 water level (bottom-up fill). */
export function waterLevelToTopSegmentIndex(waterLevel: number) {
  const clamped = clampPercent(waterLevel);
  if (clamped === 0) return -1;
  return Math.round((clamped / 100) * WATER_LED_SEGMENT_COUNT) - 1;
}

/**
 * Stateless preview of the firmware's pump control for disconnected/demo
 * mode: on once the water level has risen above the HIGH trigger point.
 * Both are plain water-level percentages, so no remapping is involved.
 * Unlike the firmware's hysteresis — which also needs the LOW trigger to
 * decide when to turn back off — this has no memory of a prior state to hold
 * onto, so LOW plays no part here. A water level at or below the HIGH trigger
 * (e.g. an empty/0% reading) always reads as OFF.
 */
export function isPumpOn(waterLevel: number, triggerLevelHigh: number): boolean {
  return clampPercent(waterLevel) > clampPercent(triggerLevelHigh);
}

export type PumpLedSegmentState = "red" | "green" | "off";

/**
 * Colour of a pump LED segment for the current thresholds. Index 0 is the
 * bottom of the column; indices increase upward.
 *
 * Both thresholds roam the whole column, so the colour bands follow them
 * rather than fixed halves: below LOW is red, above HIGH is green, and the
 * dead band between the two is off. Thresholds that meet leave no dead band.
 */
export function getPumpLedSegmentState(
  segmentIndex: number,
  triggerLevelLow: number,
  triggerLevelHigh: number,
): PumpLedSegmentState {
  if (segmentIndex < getLowThresholdBoundaryIndex(triggerLevelLow)) return "red";
  if (segmentIndex >= getHighThresholdBoundaryIndex(triggerLevelHigh)) {
    return "green";
  }
  return "off";
}
