import type { ScaleColor, ScaleReading } from "./types";

export const SCALE_COLOR_OPTIONS: {
  value: ScaleColor;
  label: string;
  swatch: string;
}[] = [
  { value: "green", label: "Green", swatch: "#3d9e48" },
  { value: "blue", label: "Blue", swatch: "#4cb1e5" },
  { value: "orange", label: "Orange", swatch: "#e8913a" },
  { value: "red", label: "Red", swatch: "#d94040" },
  { value: "yellow", label: "Yellow", swatch: "#ffc500" },
  { value: "purple", label: "Purple", swatch: "#7c5cbf" },
];

export type ScaleFormValues = {
  conveyorName: string;
  ipAddress: string;
  highProductionLimit: string;
  lowProductionLimit: string;
  highBeltSpeedLimit: string;
  dailyProductionGoal: string;
  shift2ProductionGoal: string;
  isFeedScale: boolean;
  feedScaleLocationId: string;
  scaleNameOptional: string;
  modbusAddress: string;
  targetProductionRate: string;
  blackBeltLimit: string;
  stoppedBeltLimit: string;
  shift1ProductionGoal: string;
  shift3ProductionGoal: string;
  color: ScaleColor;
};

export function createDefaultScaleConfig(): Omit<
  ScaleReading,
  "id" | "name" | "state" | "subtitle"
> {
  return {
    conveyorName: "",
    ipAddress: "",
    scaleNameOptional: "",
    modbusAddress: 100,
    highProductionLimit: 0,
    lowProductionLimit: 0,
    targetProductionRate: 0,
    blackBeltLimit: 0,
    highBeltSpeedLimit: 0,
    stoppedBeltLimit: 0,
    dailyProductionGoal: 0,
    shift1ProductionGoal: 0,
    shift2ProductionGoal: 0,
    shift3ProductionGoal: 0,
    isFeedScale: false,
    feedScaleLocationId: "",
    color: "green",
  };
}

export function createDemoScaleConfig(
  overrides: Partial<
    Omit<ScaleReading, "id" | "name" | "state" | "subtitle">
  > = {},
): Omit<ScaleReading, "id" | "name" | "state" | "subtitle"> {
  return {
    ...createDefaultScaleConfig(),
    ...overrides,
  };
}

function numberToField(value: number | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return "0";
  }
  return String(value);
}

function parseNumberField(value: string, label: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

export function scaleToFormValues(scale: ScaleReading): ScaleFormValues {
  return {
    conveyorName: scale.conveyorName,
    ipAddress: scale.ipAddress,
    highProductionLimit: numberToField(scale.highProductionLimit),
    lowProductionLimit: numberToField(scale.lowProductionLimit),
    highBeltSpeedLimit: numberToField(scale.highBeltSpeedLimit),
    dailyProductionGoal: numberToField(scale.dailyProductionGoal),
    shift2ProductionGoal: numberToField(scale.shift2ProductionGoal),
    isFeedScale: scale.isFeedScale,
    feedScaleLocationId: scale.feedScaleLocationId,
    scaleNameOptional: scale.scaleNameOptional,
    modbusAddress: numberToField(scale.modbusAddress),
    targetProductionRate: numberToField(scale.targetProductionRate),
    blackBeltLimit: numberToField(scale.blackBeltLimit),
    stoppedBeltLimit: numberToField(scale.stoppedBeltLimit),
    shift1ProductionGoal: numberToField(scale.shift1ProductionGoal),
    shift3ProductionGoal: numberToField(scale.shift3ProductionGoal),
    color: scale.color,
  };
}

export function applyFormValuesToScale(
  scale: ScaleReading,
  values: ScaleFormValues,
): ScaleReading {
  return {
    ...scale,
    conveyorName: values.conveyorName.trim(),
    ipAddress: values.ipAddress.trim(),
    scaleNameOptional: values.scaleNameOptional.trim(),
    modbusAddress: Number(values.modbusAddress),
    highProductionLimit: Number(values.highProductionLimit),
    lowProductionLimit: Number(values.lowProductionLimit),
    targetProductionRate: Number(values.targetProductionRate),
    blackBeltLimit: Number(values.blackBeltLimit),
    highBeltSpeedLimit: Number(values.highBeltSpeedLimit),
    stoppedBeltLimit: Number(values.stoppedBeltLimit),
    dailyProductionGoal: Number(values.dailyProductionGoal),
    shift1ProductionGoal: Number(values.shift1ProductionGoal),
    shift2ProductionGoal: Number(values.shift2ProductionGoal),
    shift3ProductionGoal: Number(values.shift3ProductionGoal),
    isFeedScale: values.isFeedScale,
    feedScaleLocationId: values.feedScaleLocationId,
    color: values.color,
  };
}

export function validateScaleForm(values: ScaleFormValues): string | null {
  if (!values.conveyorName.trim()) {
    return "Conveyor name is required.";
  }

  const numericFields: { value: string; label: string }[] = [
    { value: values.highProductionLimit, label: "High Production Limit" },
    { value: values.lowProductionLimit, label: "Low Production Limit" },
    { value: values.highBeltSpeedLimit, label: "High Belt Speed Limit" },
    { value: values.dailyProductionGoal, label: "Daily Production Goal" },
    { value: values.shift1ProductionGoal, label: "Shift 1 Production Goal" },
    { value: values.shift2ProductionGoal, label: "Shift 2 Production Goal" },
    { value: values.shift3ProductionGoal, label: "Shift 3 Production Goal" },
    { value: values.modbusAddress, label: "Modbus Address" },
    { value: values.targetProductionRate, label: "Target Production Rate" },
    { value: values.blackBeltLimit, label: "Black Belt Limit" },
    { value: values.stoppedBeltLimit, label: "Stopped Belt Limit" },
  ];

  for (const field of numericFields) {
    if (parseNumberField(field.value, field.label) == null) {
      return `${field.label} must be a valid number.`;
    }
  }

  if (values.isFeedScale && !values.feedScaleLocationId) {
    return "Select a location for Feed Scales.";
  }

  return null;
}

export function getColorSwatch(color: ScaleColor): string {
  return (
    SCALE_COLOR_OPTIONS.find((option) => option.value === color)?.swatch ??
    "#3d9e48"
  );
}

export function formatFeedScaleLocationLabel(locationName: string): string {
  return `${locationName} (Location)`;
}
