import { PUMP_COUNT } from "./constants";
import type { PumpMonitoringData } from "./types";

/** Demo values until live device data is wired. */
export function createDemoPumpMonitoringData(): PumpMonitoringData {
  const waterLevel = 72;

  const pumps = Array.from({ length: PUMP_COUNT }, (_, pumpIndex) => {
    const id = pumpIndex + 1;
    return {
      id,
      triggerLevelHigh: 65 - pumpIndex * 6,
      triggerLevelLow: 40 - pumpIndex * 5,
      runtimeHours: 12 + pumpIndex,
    };
  });

  return { waterLevel, pumps };
}
