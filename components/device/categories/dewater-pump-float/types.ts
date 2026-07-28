export type PumpStatus = {
  id: number;
  /**
   * Whether the pump takes part in the water-level control loop. A disabled
   * pump is held off by the firmware and its column is inert in the UI.
   */
  enabled: boolean;
  /** Water level % that turns the pump on; 0 = column bottom, 100 = top. */
  triggerLevelHigh: number;
  /** Water level % that turns the pump off; never above `triggerLevelHigh`. */
  triggerLevelLow: number;
  /** Disconnected-state stand-in for the current (since last reset) runtime. */
  runtimeHours: number;
  /** Disconnected-state stand-in for the lifetime (since install) runtime. */
  totalRuntimeHours: number;
};

export type PumpMonitoringData = {
  waterLevel: number;
  pumps: PumpStatus[];
};

export type PumpTriggerBand = "high" | "low";
