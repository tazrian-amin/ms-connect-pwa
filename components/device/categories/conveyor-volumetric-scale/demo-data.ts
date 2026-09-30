import { createDemoScaleConfig } from "./scale-settings";
import type { ScaleMonitoringData } from "./types";

/** Demo values until live scale data is wired. */
export function createDemoScaleMonitoringData(): ScaleMonitoringData {
  return {
    shiftNumber: 1,
    scale: {
      ...createDemoScaleConfig({
        highBeltSpeedLimit: 500,
        stoppedBeltLimit: 10,
      }),
      id: "vs-1",
      name: "Scale-1",
      subtitle: '3/4"',
      state: "optimum-range",
      rateTonPerHr: 863.8,
      beltSpeedFtPerMin: 455.1,
      dailyGoalPercent: 21.9,
      dailyProductionTon: 5577,
      shiftProductionTon: 40,
    },
  };
}
