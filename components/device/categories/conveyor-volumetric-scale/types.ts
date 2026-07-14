export type ScaleOperationalState =
  | "offline"
  | "stopped-belt"
  | "black-belt"
  | "below-range"
  | "optimum-range"
  | "above-range";

export type WeightUnit = "tons-english" | "tonnes-metric" | "pounds";

export type RateUnit = "tons-hour" | "tonnes-hour" | "pounds-hour";

export type SpeedUnit = "feet-minute" | "meters-minute";

export type GoalsType = "goals-by-day" | "goals-by-shift";

export type ShiftSchedule = {
  startTime: string;
  endTime: string;
};

export type LocationDisplayTotals = {
  showShiftTotal: boolean;
  showJobTotal: boolean;
  showScaleTotal: boolean;
};

export type ScaleColor =
  | "green"
  | "blue"
  | "orange"
  | "red"
  | "yellow"
  | "purple";

export type ScaleReading = {
  id: string;
  name: string;
  subtitle?: string;
  state: ScaleOperationalState;
  rateTonPerHr?: number;
  beltSpeedFtPerMin?: number;
  dailyGoalPercent?: number;
  dailyProductionTon?: number;
  shiftProductionTon?: number;
  conveyorName: string;
  ipAddress: string;
  scaleNameOptional: string;
  modbusAddress: number;
  highProductionLimit: number;
  lowProductionLimit: number;
  targetProductionRate: number;
  blackBeltLimit: number;
  highBeltSpeedLimit: number;
  stoppedBeltLimit: number;
  dailyProductionGoal: number;
  shift1ProductionGoal: number;
  shift2ProductionGoal: number;
  shift3ProductionGoal: number;
  isFeedScale: boolean;
  feedScaleLocationId: string;
  color: ScaleColor;
};

export type LocationTotal = {
  rateTonPerHr: number;
  dailyGoalPercent: number;
  dailyProductionTon: number;
  shiftProductionTon: number;
};

export type ScaleLocation = {
  id: string;
  name: string;
  shiftNumber: number;
  weightUnit: WeightUnit;
  rateUnit: RateUnit;
  speedUnit: SpeedUnit;
  goalsType: GoalsType;
  shiftSchedules: [ShiftSchedule, ShiftSchedule, ShiftSchedule];
  displayTotals: LocationDisplayTotals;
  scales: ScaleReading[];
  total: LocationTotal;
};

export type ScaleMonitoringData = {
  locations: ScaleLocation[];
};
