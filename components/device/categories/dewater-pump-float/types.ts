export type PumpStatus = {
  id: number;
  /** 0–100 within the green (HIGH) zone; 0 = zone bottom, 100 = zone top. */
  triggerLevelHigh: number;
  /** 0–100 within the red (LOW) zone; 0 = zone bottom, 100 = zone top. */
  triggerLevelLow: number;
  runtimeHours: number;
};

export type PumpMonitoringData = {
  waterLevel: number;
  pumps: PumpStatus[];
};

export type PumpTriggerBand = "high" | "low";
