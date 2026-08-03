import type { DeviceReading } from "@/types/bluetooth";

/**
 * The dashboard holds no copy of any device setting: every threshold, enable
 * flag, counter and column binding below is read straight out of what the
 * firmware has reported, so the UI can only ever show a value the device
 * confirmed.
 *
 * The keys are the firmware's read-back names (`column_1_high_thr`), not its
 * command names (`column_1_set_high`) — the firmware mirrors both into every
 * ack precisely so a confirmation lands here without a follow-up query.
 */

function readNumber(readings: DeviceReading[], id: string): number | null {
  const raw = readings.find((reading) => reading.id === id)?.value;
  if (raw === undefined) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * How the device shares demand across the enabled pumps. Off, a column is
 * simply its own pump; on either alteration setting, a column is a role and
 * the device rotates which pump fills it to level out that measure.
 */
export const AlterationMode = {
  Off: 0,
  Starts: 1,
  Runtime: 2,
} as const;

export type AlterationModeValue =
  (typeof AlterationMode)[keyof typeof AlterationMode];

export function isAlterationMode(value: number): value is AlterationModeValue {
  return value === 0 || value === 1 || value === 2;
}

export function readAlterationMode(
  readings: DeviceReading[],
): AlterationModeValue | null {
  const mode = readNumber(readings, "alteration_mode");
  return mode !== null && isAlterationMode(mode) ? mode : null;
}

/** Thresholds the firmware holds for one column; null = not reported yet. */
export interface ReportedColumnSettings {
  triggerLevelHigh: number | null;
  triggerLevelLow: number | null;
}

export function readColumnSettings(
  readings: DeviceReading[],
  columnNumber: number,
): ReportedColumnSettings {
  return {
    triggerLevelHigh: readNumber(readings, `column_${columnNumber}_high_thr`),
    triggerLevelLow: readNumber(readings, `column_${columnNumber}_low_thr`),
  };
}

/**
 * Pump the device has bound to this column, or null for a column no pump has
 * been put to yet — the T.B.D. case. The firmware reports 0 for unbound, which
 * is never a pump number.
 */
export function readColumnPump(
  readings: DeviceReading[],
  columnNumber: number,
): number | null {
  const pumpId = readNumber(readings, `column_${columnNumber}_pump`);
  return pumpId === null || pumpId < 1 ? null : pumpId;
}

/** Per-pump state the firmware reports; null = not reported yet. */
export interface ReportedPumpSettings {
  enabled: boolean | null;
  totalStarts: number | null;
  currentStarts: number | null;
  /**
   * Whether the device has raised a fault against this pump. No firmware build
   * reports it yet — `pump_N_fault` is not in the read-back table, and
   * `get_pump_states` does not carry it — so this reads null on every real
   * device today and the status row never shows "Fault". It is wired on the
   * name the rest of the pump block would use, so it lights up as soon as the
   * firmware starts reporting one, with no change here.
   */
  faulted: boolean | null;
}

export function readPumpSettings(
  readings: DeviceReading[],
  pumpId: number,
): ReportedPumpSettings {
  const enabled = readNumber(readings, `pump_${pumpId}_enabled`);
  const faulted = readNumber(readings, `pump_${pumpId}_fault`);
  return {
    enabled: enabled === null ? null : enabled === 1,
    totalStarts: readNumber(readings, `pump_${pumpId}_total_starts`),
    currentStarts: readNumber(readings, `pump_${pumpId}_current_starts`),
    faulted: faulted === null ? null : faulted !== 0,
  };
}

/** The device's water-level alarm band; null on either side = not reported. */
export function readWaterBand(readings: DeviceReading[]): {
  high: number | null;
  low: number | null;
} {
  return {
    high: readNumber(readings, "water_high_thr"),
    low: readNumber(readings, "water_low_thr"),
  };
}

export function readPumpMinOffTime(readings: DeviceReading[]): number | null {
  return readNumber(readings, "pump_min_off_time_min");
}

/**
 * Matches the device's answer to one command: either it carries `field` back
 * (the confirmation) or it rejects that command by name. Waiting on the
 * rejection too is what turns a bad value into an immediate message rather
 * than a ten-second wait for a reply that was never coming.
 *
 * The rejection is matched on `commandKey` rather than on `status` alone
 * because two commands can be in flight at once (two pumps, or the water
 * band's two levels), and every waiter would otherwise claim the first error
 * to arrive — reporting a failure against a control that never had one. Every
 * `set_` error the firmware raises names the key it rejected.
 */
export function replyCarrying(
  field: string,
  commandKey: string,
): (json: Record<string, unknown>) => boolean {
  return (json) => {
    if (json[field] !== undefined) return true;
    return (
      json.status === "error" &&
      typeof json.msg === "string" &&
      json.msg.includes(commandKey)
    );
  };
}
