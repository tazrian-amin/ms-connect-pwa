export type ScaleOperationalState =
  | "offline"
  | "stopped-belt"
  | "black-belt"
  | "below-range"
  | "optimum-range"
  | "above-range";

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
  highBeltSpeedLimit: number;
  stoppedBeltLimit: number;
};

export type ScaleMonitoringData = {
  scale: ScaleReading;
  /** The shift the device reports as current, for the production column. */
  shiftNumber: number;
};
