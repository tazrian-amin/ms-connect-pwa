import { PUMP_COUNT } from "./constants";
import type { PumpMonitoringData } from "./types";

/**
 * Stands in for the device's start counters while disconnected. Arbitrary, but
 * all different, so the demo binding below reads as a real duty ranking rather
 * than a pile of ties. Indexed by pump id − 1.
 */
const DEMO_PUMP_STARTS = [18, 7, 31, 3, 24, 11];

/** Initial/disconnected-state values, until live device data is wired. */
export function createDemoPumpMonitoringData(): PumpMonitoringData {
  const waterLevel = 0;

  const pumps = Array.from({ length: PUMP_COUNT }, (_, pumpIndex) => ({
    id: pumpIndex + 1,
    enabled: true,
    runtimeHours: 0,
    totalRuntimeHours: 0,
    totalStarts: DEMO_PUMP_STARTS[pumpIndex] ?? 0,
    currentStarts: DEMO_PUMP_STARTS[pumpIndex] ?? 0,
    faulted: false,
  }));

  // Columns default to their own pump, the same arrangement the device reports
  // with alteration off.
  const columns = Array.from({ length: PUMP_COUNT }, (_, columnIndex) => ({
    number: columnIndex + 1,
    triggerLevelHigh: 50,
    triggerLevelLow: 25,
    pumpId: columnIndex + 1,
  }));

  return { waterLevel, pumps, columns };
}

/**
 * Stands in for the device's column bindings under alteration while
 * disconnected, so the mode still demonstrates itself without hardware.
 * Ranked from the counts above by the device's own rule — least-used pump to
 * the first-to-start column — giving #4 #2 #6 #1 #5 #3 left to right.
 *
 * On real hardware the leftmost columns fill in first and the rest stay T.B.D.
 * until demand reaches them; the demo shows them all bound, since nothing here
 * ever runs.
 */
export const DEMO_COLUMN_PUMPS = new Map<number, number>(
  DEMO_PUMP_STARTS.map((starts, pumpIndex) => [pumpIndex + 1, starts] as const)
    .sort((a, b) => a[1] - b[1])
    .map(([pumpId], columnIndex) => [columnIndex + 1, pumpId]),
);
