import { PUMP_COUNT } from "./constants";
import type { PumpMonitoringData } from "./types";

/** Initial/disconnected-state values, until live device data is wired. */
export function createDemoPumpMonitoringData(): PumpMonitoringData {
  const waterLevel = 0;

  const pumps = Array.from({ length: PUMP_COUNT }, (_, pumpIndex) => {
    const id = pumpIndex + 1;
    return {
      id,
      triggerLevelHigh: 50,
      triggerLevelLow: 25,
      runtimeHours: 0,
    };
  });

  return {
    waterLevel,
    waterTriggerLevelHigh: 75,
    waterTriggerLevelLow: 25,
    pumps,
  };
}
