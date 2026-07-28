export type PumpStatus = {
  id: number;
  /** Water level % that turns the pump on; 0 = column bottom, 100 = top. */
  triggerLevelHigh: number;
  /** Water level % that turns the pump off; never above `triggerLevelHigh`. */
  triggerLevelLow: number;
  runtimeHours: number;
};

export type PumpMonitoringData = {
  waterLevel: number;
  /** Water column's own trigger band, independent of the per-pump triggers. */
  waterTriggerLevelHigh: number;
  waterTriggerLevelLow: number;
  pumps: PumpStatus[];
};

export type PumpTriggerBand = "high" | "low";
