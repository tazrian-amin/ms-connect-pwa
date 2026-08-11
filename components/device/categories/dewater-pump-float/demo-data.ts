import { PUMP_COUNT } from "./constants";
import { OperationMode, type OperationModeValue } from "./device-settings";
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
  // with alteration off. The two levels are feet, and match the firmware's own
  // defaults (kDefaultColumnHighThr/kDefaultColumnLowThr) so a freshly flashed
  // device and a disconnected dashboard agree.
  const columns = Array.from({ length: PUMP_COUNT }, (_, columnIndex) => ({
    number: columnIndex + 1,
    triggerLevelHigh: 30,
    triggerLevelLow: 15,
    pumpId: columnIndex + 1,
  }));

  return { waterLevel, pumps, columns };
}

/** One column's pair of trigger levels, in feet. */
export type ColumnLevels = { high: number; low: number };

/**
 * Stands in for the device's per-mode threshold sets while disconnected, so
 * selecting an operation mode still moves the columns without hardware.
 *
 * Every column in a mode starts on the same pair — the device has no opinion
 * about which column is which either — but the three pairs differ, so the
 * point of the setting is visible the moment a mode is picked. Normal matches
 * the firmware's own defaults; winter holds a deeper working level; flush
 * pumps the shaft right down.
 */
const DEMO_MODE_LEVELS: Record<OperationModeValue, ColumnLevels> = {
  [OperationMode.Normal]: { high: 30, low: 15 },
  [OperationMode.Winter]: { high: 45, low: 30 },
  [OperationMode.Flush]: { high: 20, low: 2 },
};

/** A full set of six columns' levels per mode — the demo's threshold store. */
export function createDemoModeColumnLevels(): Record<
  OperationModeValue,
  ColumnLevels[]
> {
  const forMode = (mode: OperationModeValue) =>
    Array.from({ length: PUMP_COUNT }, () => ({ ...DEMO_MODE_LEVELS[mode] }));
  return {
    [OperationMode.Normal]: forMode(OperationMode.Normal),
    [OperationMode.Winter]: forMode(OperationMode.Winter),
    [OperationMode.Flush]: forMode(OperationMode.Flush),
  };
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
