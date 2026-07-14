import type { ShiftSchedule } from "../types";

export type RateGraphPreset =
  | "today"
  | "2-days"
  | "7-days"
  | "14-days"
  | "30-days"
  | "custom";

export type RateGraphTimeMode = "all-day" | "by-shift" | "custom-time";

export type RateGraphDataPoint = {
  timestamp: number;
  rateTonPerHr: number;
  beltSpeedFtPerMin: number;
  cumulativeTotalTon: number;
};

export type RateGraphQuery = {
  preset: RateGraphPreset;
  startDate: Date;
  endDate: Date;
  timeMode: RateGraphTimeMode;
  shiftIndex: 0 | 1 | 2;
  customTimeStart: string;
  customTimeEnd: string;
};

export type RateGraphLocationContext = {
  locationId: string;
  locationName: string;
  shiftSchedules: [ShiftSchedule, ShiftSchedule, ShiftSchedule];
};

export type RateGraphScaleContext = {
  scaleId: string;
  scaleName: string;
  lowProductionLimit: number;
  highProductionLimit: number;
  targetProductionRate: number;
};
