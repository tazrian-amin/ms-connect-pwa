import {
  LED_COLUMN_HEIGHT,
  THRESHOLD_MARKER_HEIGHT,
  THRESHOLD_POINTER_HEIGHT,
  THRESHOLD_POINTER_MIN_GAP,
  THRESHOLD_TRACK_HEIGHT,
  THRESHOLD_TRACK_TOP,
} from "./constants";

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, value));
}

/** Map 0–100 (stack bottom→top) to the marker's offset from the column top. */
export function levelToTrackOffset(level: number): number {
  return (
    THRESHOLD_TRACK_TOP + (1 - clampPercent(level) / 100) * THRESHOLD_TRACK_HEIGHT
  );
}

/** Inverse of `levelToTrackOffset`, snapped to whole percent. */
export function trackOffsetToLevel(offset: number): number {
  const travelled = (offset - THRESHOLD_TRACK_TOP) / THRESHOLD_TRACK_HEIGHT;
  return Math.round(clampPercent(100 * (1 - travelled)));
}

export interface ThresholdPointerLayout {
  /** Offset of the exact-threshold marker from the column top. */
  markerTop: number;
  /** Offset of the label pill; nudged off the marker when the two converge. */
  pillTop: number;
}

/**
 * Places both pointers. HIGH and LOW are free to meet, at which point their
 * pills would sit on top of each other — so once they are closer than a pill
 * height, the pills stack around the midpoint (HIGH above, LOW below) and
 * shift as a pair to stay inside the column. Markers always stay exact.
 */
export function resolveThresholdLayout(
  triggerLevelHigh: number,
  triggerLevelLow: number,
): { high: ThresholdPointerLayout; low: ThresholdPointerLayout } {
  const highMarker = levelToTrackOffset(triggerLevelHigh);
  const lowMarker = levelToTrackOffset(triggerLevelLow);

  let highPill = highMarker - THRESHOLD_POINTER_HEIGHT / 2;
  let lowPill = lowMarker - THRESHOLD_POINTER_HEIGHT / 2;

  if (lowPill - highPill < THRESHOLD_POINTER_HEIGHT + THRESHOLD_POINTER_MIN_GAP) {
    const midpoint = (highMarker + lowMarker) / 2;
    highPill =
      midpoint - THRESHOLD_POINTER_HEIGHT - THRESHOLD_POINTER_MIN_GAP / 2;
    lowPill = midpoint + THRESHOLD_POINTER_MIN_GAP / 2;

    const overflow =
      Math.max(0, -highPill) -
      Math.max(0, lowPill + THRESHOLD_POINTER_HEIGHT - LED_COLUMN_HEIGHT);
    highPill += overflow;
    lowPill += overflow;
  }

  return {
    high: { markerTop: highMarker - THRESHOLD_MARKER_HEIGHT / 2, pillTop: highPill },
    low: { markerTop: lowMarker - THRESHOLD_MARKER_HEIGHT / 2, pillTop: lowPill },
  };
}
