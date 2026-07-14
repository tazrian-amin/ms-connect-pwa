import { createDefaultLocationSettings } from "./location-settings";
import { createDemoScaleConfig } from "./scale-settings";
import type { ScaleMonitoringData, ScaleReading } from "./types";

function createScale(
  scale: Pick<ScaleReading, "id" | "name" | "state"> &
    Partial<Omit<ScaleReading, "id" | "name" | "state">>,
): ScaleReading {
  return {
    ...createDemoScaleConfig(),
    ...scale,
  };
}

/** Demo values until live scale data is wired. */
export function createDemoScaleMonitoringData(): ScaleMonitoringData {
  const defaultSettings = createDefaultLocationSettings();

  return {
    locations: [
      {
        id: "crushing-plant",
        name: "Crushing Plant",
        shiftNumber: 1,
        ...defaultSettings,
        shiftSchedules: [
          { startTime: "06:00", endTime: "14:00" },
          { startTime: "14:01", endTime: "22:00" },
          { startTime: "00:00", endTime: "00:00" },
        ],
        scales: [
          createScale({
            id: "feed-cv-1",
            name: "FEED: CV-1",
            subtitle: '3/4"',
            state: "optimum-range",
            rateTonPerHr: 863.8,
            beltSpeedFtPerMin: 455.1,
            dailyGoalPercent: 21.9,
            dailyProductionTon: 5577,
            shiftProductionTon: 40,
            conveyorName: "CV-1",
            ipAddress: "192.168.001.104",
            scaleNameOptional: "00:11:27:85:AA:EF",
            modbusAddress: 100,
            highProductionLimit: 620,
            lowProductionLimit: 500,
            targetProductionRate: 550,
            blackBeltLimit: 10,
            highBeltSpeedLimit: 500,
            stoppedBeltLimit: 10,
            dailyProductionGoal: 30000,
            shift1ProductionGoal: 200,
            shift2ProductionGoal: 0,
            shift3ProductionGoal: 0,
            isFeedScale: true,
            feedScaleLocationId: "crushing-plant",
            color: "green",
          }),
          createScale({
            id: "feed-cv-2",
            name: "FEED: CV-2",
            subtitle: '1/2"',
            state: "below-range",
            rateTonPerHr: 359.4,
            beltSpeedFtPerMin: 273.7,
            dailyGoalPercent: 10.3,
            dailyProductionTon: 2626,
            shiftProductionTon: 10,
            conveyorName: "CV-2",
            isFeedScale: true,
            feedScaleLocationId: "crushing-plant",
            highProductionLimit: 420,
            lowProductionLimit: 300,
            targetProductionRate: 360,
          }),
          createScale({
            id: "cv-2",
            name: "CV-2",
            state: "optimum-range",
            rateTonPerHr: 364.2,
            beltSpeedFtPerMin: 205.9,
            dailyGoalPercent: 10.0,
            dailyProductionTon: 2539,
            shiftProductionTon: 12,
            conveyorName: "CV-2",
            highProductionLimit: 420,
            lowProductionLimit: 300,
            targetProductionRate: 365,
          }),
          createScale({
            id: "product",
            name: "PRODUCT",
            subtitle: "Sand",
            state: "below-range",
            rateTonPerHr: 195.3,
            beltSpeedFtPerMin: 181.3,
            dailyGoalPercent: 8.2,
            dailyProductionTon: 2086,
            shiftProductionTon: 6,
            conveyorName: "PRODUCT",
            highProductionLimit: 240,
            lowProductionLimit: 150,
            targetProductionRate: 195,
          }),
        ],
        total: {
          rateTonPerHr: 1782.7,
          dailyGoalPercent: 12.6,
          dailyProductionTon: 12828,
          shiftProductionTon: 68,
        },
      },
      {
        id: "mobile-plant",
        name: "Mobile Plant",
        shiftNumber: 2,
        ...defaultSettings,
        shiftSchedules: [
          { startTime: "07:01", endTime: "15:00" },
          { startTime: "15:01", endTime: "23:00" },
          { startTime: "23:01", endTime: "07:00" },
        ],
        scales: [
          createScale({
            id: "mobile-1",
            name: "Mobile 1",
            subtitle: "FEED",
            state: "offline",
            conveyorName: "Mobile 1",
          }),
          createScale({
            id: "mobile-2",
            name: "Mobile 2",
            subtitle: "FEED",
            state: "black-belt",
            rateTonPerHr: 53.3,
            beltSpeedFtPerMin: 147.5,
            dailyGoalPercent: 2.1,
            dailyProductionTon: 528,
            shiftProductionTon: 0,
            conveyorName: "Mobile 2",
            isFeedScale: true,
            feedScaleLocationId: "mobile-plant",
            highProductionLimit: 70,
            lowProductionLimit: 40,
            targetProductionRate: 55,
          }),
          createScale({
            id: "mobile-3",
            name: "Mobile 3",
            subtitle: "Product",
            state: "offline",
            conveyorName: "Mobile 3",
          }),
        ],
        total: {
          rateTonPerHr: 53.3,
          dailyGoalPercent: 2.1,
          dailyProductionTon: 528,
          shiftProductionTon: 0,
        },
      },
    ],
  };
}
