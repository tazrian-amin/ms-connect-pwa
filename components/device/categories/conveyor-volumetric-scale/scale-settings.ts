import type { Quantity } from "./units";
import type { ScaleReading } from "./types";

/**
 * The scale's belt and production thresholds, set from Scale Settings.
 * Held in ft/min, US tons per hour and US tons — see units.ts.
 */
export type ScaleLimitField =
  | "highBeltSpeedLimit"
  | "stoppedBeltLimit"
  | "targetProductionRate"
  | "highProductionLimit"
  | "lowProductionLimit"
  | "blackBeltLimit"
  | "dailyProductionGoal"
  | "shiftProductionGoal";

export type ScaleLimits = Pick<ScaleReading, ScaleLimitField>;

export interface ScaleLimitFieldDefinition {
  key: ScaleLimitField;
  label: string;
  quantity: Quantity;
}

export const BELT_LIMIT_FIELDS: ScaleLimitFieldDefinition[] = [
  { key: "highBeltSpeedLimit", label: "High Belt Speed Limit", quantity: "speed" },
  { key: "stoppedBeltLimit", label: "Stopped Belt Limit", quantity: "speed" },
];

export const PRODUCTION_LIMIT_FIELDS: ScaleLimitFieldDefinition[] = [
  { key: "targetProductionRate", label: "Target Production Rate", quantity: "rate" },
  { key: "highProductionLimit", label: "High Production Limit", quantity: "rate" },
  { key: "lowProductionLimit", label: "Low Production Limit", quantity: "rate" },
  { key: "blackBeltLimit", label: "Black Belt Limit", quantity: "rate" },
];

export const PRODUCTION_GOAL_FIELDS: ScaleLimitFieldDefinition[] = [
  { key: "dailyProductionGoal", label: "Daily Production Goal", quantity: "weight" },
  { key: "shiftProductionGoal", label: "Shift Production Goal", quantity: "weight" },
];

export const SCALE_LIMIT_FIELDS = [...BELT_LIMIT_FIELDS, ...PRODUCTION_LIMIT_FIELDS, ...PRODUCTION_GOAL_FIELDS];

export function createDefaultScaleConfig(): ScaleLimits {
  return {
    highProductionLimit: 0,
    lowProductionLimit: 0,
    targetProductionRate: 0,
    blackBeltLimit: 0,
    highBeltSpeedLimit: 0,
    stoppedBeltLimit: 0,
    dailyProductionGoal: 0,
    shiftProductionGoal: 0,
  };
}

export function createDemoScaleConfig(overrides: Partial<ScaleLimits> = {}): ScaleLimits {
  return {
    ...createDefaultScaleConfig(),
    ...overrides,
  };
}

export function pickScaleLimits(scale: ScaleReading): ScaleLimits {
  return Object.fromEntries(SCALE_LIMIT_FIELDS.map(({ key }) => [key, scale[key]])) as ScaleLimits;
}
