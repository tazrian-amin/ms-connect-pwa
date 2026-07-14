import type {
  GoalsType,
  RateUnit,
  ScaleLocation,
  ShiftSchedule,
  SpeedUnit,
  WeightUnit,
} from "./types";

export const WEIGHT_UNIT_OPTIONS: { value: WeightUnit; label: string }[] = [
  { value: "tons-english", label: "Tons (English)" },
  { value: "tonnes-metric", label: "Tonnes (Metric)" },
  { value: "pounds", label: "Pounds" },
];

export const RATE_UNIT_OPTIONS: { value: RateUnit; label: string }[] = [
  { value: "tons-hour", label: "Tons / Hour" },
  { value: "tonnes-hour", label: "Tonnes / Hour" },
  { value: "pounds-hour", label: "Pounds / Hour" },
];

export const SPEED_UNIT_OPTIONS: { value: SpeedUnit; label: string }[] = [
  { value: "feet-minute", label: "Feet / Minute" },
  { value: "meters-minute", label: "Meters / Minute" },
];

export const GOALS_TYPE_OPTIONS: { value: GoalsType; label: string }[] = [
  { value: "goals-by-day", label: "Goals by Day" },
  { value: "goals-by-shift", label: "Goals by Shift" },
];

export const DEFAULT_SHIFT_SCHEDULES: [
  ShiftSchedule,
  ShiftSchedule,
  ShiftSchedule,
] = [
  { startTime: "07:01", endTime: "15:00" },
  { startTime: "15:01", endTime: "23:00" },
  { startTime: "23:01", endTime: "07:00" },
];

export const UNUSED_SHIFT_SCHEDULE: ShiftSchedule = {
  startTime: "00:00",
  endTime: "00:00",
};

export function createDefaultLocationSettings(): Pick<
  ScaleLocation,
  | "weightUnit"
  | "rateUnit"
  | "speedUnit"
  | "goalsType"
  | "shiftSchedules"
  | "displayTotals"
> {
  return {
    weightUnit: "tons-english",
    rateUnit: "tons-hour",
    speedUnit: "feet-minute",
    goalsType: "goals-by-day",
    shiftSchedules: [...DEFAULT_SHIFT_SCHEDULES],
    displayTotals: {
      showShiftTotal: false,
      showJobTotal: false,
      showScaleTotal: false,
    },
  };
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidShiftTime(value: string): boolean {
  return TIME_PATTERN.test(value.trim());
}

export function getOptionLabel<T extends string>(
  options: { value: T; label: string }[],
  value: T,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export type LocationFormValues = {
  name: string;
  weightUnit: WeightUnit;
  rateUnit: RateUnit;
  speedUnit: SpeedUnit;
  goalsType: GoalsType;
  shiftSchedules: [ShiftSchedule, ShiftSchedule, ShiftSchedule];
  showShiftTotal: boolean;
  showJobTotal: boolean;
  showScaleTotal: boolean;
};

export function locationToFormValues(location: ScaleLocation): LocationFormValues {
  return {
    name: location.name,
    weightUnit: location.weightUnit,
    rateUnit: location.rateUnit,
    speedUnit: location.speedUnit,
    goalsType: location.goalsType,
    shiftSchedules: location.shiftSchedules.map((schedule) => ({
      ...schedule,
    })) as LocationFormValues["shiftSchedules"],
    showShiftTotal: location.displayTotals.showShiftTotal,
    showJobTotal: location.displayTotals.showJobTotal,
    showScaleTotal: location.displayTotals.showScaleTotal,
  };
}

export function applyFormValuesToLocation(
  location: ScaleLocation,
  values: LocationFormValues,
): ScaleLocation {
  return {
    ...location,
    name: values.name.trim(),
    weightUnit: values.weightUnit,
    rateUnit: values.rateUnit,
    speedUnit: values.speedUnit,
    goalsType: values.goalsType,
    shiftSchedules: values.shiftSchedules.map((schedule) => ({
      startTime: schedule.startTime.trim(),
      endTime: schedule.endTime.trim(),
    })) as ScaleLocation["shiftSchedules"],
    displayTotals: {
      showShiftTotal: values.showShiftTotal,
      showJobTotal: values.showJobTotal,
      showScaleTotal: values.showScaleTotal,
    },
  };
}

export function validateLocationForm(
  values: LocationFormValues,
): string | null {
  if (!values.name.trim()) {
    return "Location name is required.";
  }

  for (let index = 0; index < values.shiftSchedules.length; index++) {
    const shiftNumber = index + 1;
    const schedule = values.shiftSchedules[index];
    if (!isValidShiftTime(schedule.startTime)) {
      return `Shift ${shiftNumber} start time must be 00:00–23:59.`;
    }
    if (!isValidShiftTime(schedule.endTime)) {
      return `Shift ${shiftNumber} end time must be 00:00–23:59.`;
    }
  }

  return null;
}
