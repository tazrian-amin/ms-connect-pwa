import {
  PUMP_LED_ZONE_SEGMENT_COUNT,
  WATER_LED_SEGMENT_COUNT,
} from "./constants";

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

/** Segment index where the dead band starts (bottom of grey zone). */
export function getLowThresholdBoundaryIndex(triggerLevelLow: number) {
  const low = clampPercent(triggerLevelLow);
  return Math.round((low / 100) * PUMP_LED_ZONE_SEGMENT_COUNT);
}

/** First segment index above the dead band (bottom of lit green zone). */
export function getHighThresholdBoundaryIndex(triggerLevelHigh: number) {
  const high = clampPercent(triggerLevelHigh);
  return (
    PUMP_LED_ZONE_SEGMENT_COUNT +
    Math.round((high / 100) * PUMP_LED_ZONE_SEGMENT_COUNT)
  );
}

/** Topmost lit segment index for a 0–100 water level (bottom-up fill). */
export function waterLevelToTopSegmentIndex(waterLevel: number) {
  const clamped = clampPercent(waterLevel);
  if (clamped === 0) return -1;
  return Math.round((clamped / 100) * WATER_LED_SEGMENT_COUNT) - 1;
}

/**
 * Stateless preview of the firmware's pump control for disconnected/demo
 * mode: on once the water level has risen above the real HIGH trigger point.
 * Mirrors the firmware's effectivePumpHighThreshold() mapping (top half of
 * the water-level range), but — unlike the firmware's hysteresis, which also
 * needs the LOW trigger to decide when to turn back off — has no memory of a
 * prior state to hold onto, so LOW plays no part here. A water level at or
 * below the HIGH trigger (e.g. an empty/0% reading) always reads as OFF.
 */
export function isPumpOn(waterLevel: number, triggerLevelHigh: number): boolean {
  const water = clampPercent(waterLevel);
  const realHigh = 50 + clampPercent(triggerLevelHigh) / 2;
  return water > realHigh;
}

/**
 * Whether a pump LED segment should be lit from threshold sliders.
 * Index 0 is the bottom of the column (red zone); indices increase upward.
 *
 * LOW (red zone): bottom `triggerLevelLow`% of the zone is ON; upper part OFF.
 * HIGH (green zone): bottom `triggerLevelHigh`% of the zone is OFF; upper part ON.
 * The band between the two thresholds stays OFF.
 */
export function isPumpLedSegmentActive(
  segmentIndex: number,
  triggerLevelLow: number,
  triggerLevelHigh: number,
): boolean {
  const lowBoundary = getLowThresholdBoundaryIndex(triggerLevelLow);
  const highBoundary = getHighThresholdBoundaryIndex(triggerLevelHigh);

  if (segmentIndex < PUMP_LED_ZONE_SEGMENT_COUNT) {
    return segmentIndex < lowBoundary;
  }

  return segmentIndex >= highBoundary;
}
