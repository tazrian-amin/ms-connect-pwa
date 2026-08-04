/**
 * A pump — the physical unit. It owns its enable flag and its four counters,
 * and keeps them whichever column it is drawn in. Thresholds are *not* here:
 * they belong to the column, since in alteration mode the pump answering a
 * given pair of levels changes. See ColumnStatus.
 */
export type PumpStatus = {
  id: number;
  /**
   * Whether the pump takes part in the water-level control loop. A disabled
   * pump is held off by the firmware and its column is inert in the UI.
   */
  enabled: boolean;
  /** Disconnected-state stand-in for the current (since last reset) runtime. */
  runtimeHours: number;
  /** Disconnected-state stand-in for the lifetime (since install) runtime. */
  totalRuntimeHours: number;
  /** Starts since installation. Never reset. */
  totalStarts: number;
  /** Starts since the operator's last reset, alongside the session runtime. */
  currentStarts: number;
  /**
   * Whether the device has raised a fault against this pump. See
   * readPumpSettings — no firmware build reports one yet, so today this is
   * always false on real hardware.
   */
  faulted: boolean;
};

/**
 * What a pump is doing, as the status row reports it. Only one of these can be
 * true at a time, so the row shows exactly one:
 *
 * - `run` — in the control loop and currently on.
 * - `idle` — in the control loop, currently off. The normal resting state.
 * - `fault` — the device has raised a fault against it.
 * - `disabled` — held out of the control loop by its enable flag.
 *
 * A column with no pump bound (the alteration-mode T.B.D. case) has no state at
 * all, which is why this is carried as `PumpRunState | null` throughout.
 */
export type PumpRunState = "run" | "idle" | "fault" | "disabled";

/**
 * A column — a position on the dashboard, 1–6 left to right, and the thing the
 * high/low sliders belong to.
 *
 * With alteration off a column simply is its pump. With it on the column is a
 * *role* ("starts first", "starts next"), and the device binds whichever pump
 * is least used to it when that role next has to run — which is what levels
 * the duty out. `pumpId` is null for a role no pump has been put to yet, which
 * the dashboard shows as T.B.D.
 */
export type ColumnStatus = {
  /** 1-based position, matching the firmware's column numbering. */
  number: number;
  /** Water depth in feet that starts this column's pump. */
  triggerLevelHigh: number;
  /** Depth in feet that stops it; always at least a foot below the high one. */
  triggerLevelLow: number;
  /** Pump currently bound to this column, or null while none is. */
  pumpId: number | null;
};

export type PumpMonitoringData = {
  /** Current depth in feet, 0–60 (see WATER_LEVEL_MAX_FEET). */
  waterLevel: number;
  pumps: PumpStatus[];
  columns: ColumnStatus[];
};

export type PumpTriggerBand = "high" | "low";

/**
 * One of the two counters a pump keeps "since the operator's last reset". They
 * are separate figures with a reset command each — clearing the runtime leaves
 * the start count alone, and the other way round.
 */
export type SessionCounter = "runtime" | "starts";
