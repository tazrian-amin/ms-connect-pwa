/**
 * The one set of units every conveyor input is shown and entered in.
 *
 * Values themselves are always held in fixed base units — lb/ft³, ft/min and
 * US tons (per hour, for rates) — and only converted at the edges, for display
 * and for what is sent to the device. Switching units therefore never drifts a
 * stored value, and nothing downstream has to know which units are selected.
 */

export type DensityUnit = "lb_ft3" | "kg_m3" | "g_cm3" | "t_m3" | "ton_yd3";
export type SpeedUnit = "ft_min" | "m_min" | "ft_s" | "m_s";
export type WeightUnit = "ton" | "tonne" | "lb";

export interface MeasurementUnits {
  density: DensityUnit;
  speed: SpeedUnit;
  /** Also sets rates, which are this weight per hour. */
  weight: WeightUnit;
}

export const DEFAULT_UNITS: MeasurementUnits = {
  density: "lb_ft3",
  speed: "ft_min",
  weight: "ton",
};

export interface UnitDefinition<T extends string> {
  value: T;
  label: string;
  /** Multiplier into the family's SI reference (kg/m³, m/min, kg). */
  toBase: number;
}

export const DENSITY_UNITS: UnitDefinition<DensityUnit>[] = [
  { value: "lb_ft3", label: "lb/ft³", toBase: 16.018463 },
  { value: "kg_m3", label: "kg/m³", toBase: 1 },
  { value: "g_cm3", label: "g/cm³", toBase: 1000 },
  { value: "t_m3", label: "t/m³", toBase: 1000 },
  // US short ton per cubic yard: 907.18474 kg / 0.764554858 m³.
  { value: "ton_yd3", label: "US ton/yd³", toBase: 1186.552733 },
];

export const SPEED_UNITS: UnitDefinition<SpeedUnit>[] = [
  { value: "ft_min", label: "ft/min", toBase: 0.3048 },
  { value: "m_min", label: "m/min", toBase: 1 },
  { value: "ft_s", label: "ft/s", toBase: 18.288 },
  { value: "m_s", label: "m/s", toBase: 60 },
];

export const WEIGHT_UNITS: UnitDefinition<WeightUnit>[] = [
  { value: "ton", label: "US ton", toBase: 907.18474 },
  { value: "tonne", label: "tonne", toBase: 1000 },
  { value: "lb", label: "lb", toBase: 0.45359237 },
];

/** What a value measures, which decides the unit it is shown in. */
export type Quantity = "density" | "speed" | "rate" | "weight";

/** The base unit each quantity is stored in. Rates share weight's (per hour). */
const STORED_UNIT = { density: "lb_ft3", speed: "ft_min", weight: "ton" } as const;

/** Which of the selected units a quantity follows. */
export function unitKeyFor(quantity: Quantity): keyof MeasurementUnits {
  return quantity === "rate" ? "weight" : quantity;
}

function family(quantity: Quantity) {
  switch (quantity) {
    case "density":
      return { key: "density" as const, units: DENSITY_UNITS as UnitDefinition<string>[] };
    case "speed":
      return { key: "speed" as const, units: SPEED_UNITS as UnitDefinition<string>[] };
    case "rate":
    case "weight":
      return { key: "weight" as const, units: WEIGHT_UNITS as UnitDefinition<string>[] };
  }
}

function factor(units: UnitDefinition<string>[], unit: string): number {
  return units.find((definition) => definition.value === unit)?.toBase ?? 1;
}

/** A stored (base-unit) value, expressed in the selected units. */
export function toDisplay(value: number, quantity: Quantity, units: MeasurementUnits): number {
  const { key, units: definitions } = family(quantity);
  return (value * factor(definitions, STORED_UNIT[key])) / factor(definitions, units[key]);
}

/** A value entered in the selected units, back into its stored base unit. */
export function fromDisplay(value: number, quantity: Quantity, units: MeasurementUnits): number {
  const { key, units: definitions } = family(quantity);
  return (value * factor(definitions, units[key])) / factor(definitions, STORED_UNIT[key]);
}

/** The short label shown beside an input, e.g. "ft/min" or "tonne / hr". */
export function unitLabel(quantity: Quantity, units: MeasurementUnits): string {
  const { key, units: definitions } = family(quantity);
  const label = definitions.find((definition) => definition.value === units[key])?.label ?? units[key];
  return quantity === "rate" ? `${label} / hr` : label;
}

/** Up to four decimals, with trailing zeros dropped. */
export function formatQuantity(value: number): string {
  return String(Number(value.toFixed(4)));
}
