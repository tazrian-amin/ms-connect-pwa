import type { Quantity } from "./units";
import type { ScaleReading } from "./types";

/**
 * The scale's belt thresholds, set from Scale Settings.
 * Held in ft/min — see units.ts.
 */
export type ScaleLimitField = "highBeltSpeedLimit" | "stoppedBeltLimit";

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

export const SCALE_LIMIT_FIELDS = [...BELT_LIMIT_FIELDS];

export function createDefaultScaleConfig(): ScaleLimits {
  return {
    highBeltSpeedLimit: 0,
    stoppedBeltLimit: 0,
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
