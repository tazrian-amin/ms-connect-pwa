import type {
  RateGraphPreset,
  RateGraphQuery,
  RateGraphTimeMode,
} from "./types";
import type { ShiftSchedule } from "../types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const MAX_CUSTOM_RANGE_DAYS = 30;

export const RATE_GRAPH_PRESETS: {
  id: RateGraphPreset;
  label: string;
  days: number;
}[] = [
  { id: "today", label: "Today", days: 1 },
  { id: "2-days", label: "2 Days", days: 2 },
  { id: "7-days", label: "7 Days", days: 7 },
  { id: "14-days", label: "14 Days", days: 14 },
  { id: "30-days", label: "30 Days", days: 30 },
  { id: "custom", label: "Custom", days: 0 },
];

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysBetweenInclusive(start: Date, end: Date): number {
  const startMs = startOfDay(start).getTime();
  const endMs = startOfDay(end).getTime();
  return Math.floor((endMs - startMs) / MS_PER_DAY) + 1;
}

export function formatGraphAxisLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mmTime = String(date.getMinutes()).padStart(2, "0");
  return `${mm}/${dd}\n${hh}:${mmTime}`;
}

export function createPresetQuery(preset: RateGraphPreset): RateGraphQuery {
  const now = new Date();
  const endDate = endOfDay(now);
  const presetMeta = RATE_GRAPH_PRESETS.find((item) => item.id === preset);
  const days = presetMeta?.days ?? 2;
  const startDate =
    preset === "today"
      ? startOfDay(now)
      : startOfDay(addDays(now, -(days - 1)));

  return {
    preset,
    startDate,
    endDate,
    timeMode: "all-day",
    shiftIndex: 0,
    customTimeStart: "00:00",
    customTimeEnd: "23:59",
  };
}

export function createDefaultCustomQuery(): RateGraphQuery {
  const now = new Date();
  return {
    preset: "custom",
    startDate: startOfDay(addDays(now, -7)),
    endDate: endOfDay(now),
    timeMode: "by-shift",
    shiftIndex: 0,
    customTimeStart: "05:00",
    customTimeEnd: "15:00",
  };
}

export function validateCustomDateRange(
  startDate: Date,
  endDate: Date,
): string | null {
  if (startDate.getTime() > endDate.getTime()) {
    return "Start date must be on or before end date.";
  }
  const spanDays = daysBetweenInclusive(startDate, endDate);
  if (spanDays > MAX_CUSTOM_RANGE_DAYS) {
    return `Date range cannot exceed ${MAX_CUSTOM_RANGE_DAYS} days.`;
  }
  return null;
}

function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function minutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function isWithinMinutesWindow(
  value: number,
  start: number,
  end: number,
): boolean {
  if (start === end) return true;
  if (start < end) {
    return value >= start && value <= end;
  }
  return value >= start || value <= end;
}

function isNullShift(schedule: ShiftSchedule): boolean {
  return schedule.startTime === "00:00" && schedule.endTime === "00:00";
}

export function formatShiftLabel(
  index: number,
  schedule: ShiftSchedule,
): string {
  if (isNullShift(schedule)) {
    return `${index + 1}${ordinalSuffix(index + 1)} Shift: null to null`;
  }
  return `${index + 1}${ordinalSuffix(index + 1)} Shift: ${schedule.startTime} to ${schedule.endTime}`;
}

function ordinalSuffix(value: number): string {
  if (value === 1) return "st";
  if (value === 2) return "nd";
  if (value === 3) return "rd";
  return "th";
}

export function getActiveTimeWindow(
  query: RateGraphQuery,
  shiftSchedules: [ShiftSchedule, ShiftSchedule, ShiftSchedule],
): { start: number; end: number } | null {
  if (query.timeMode === "all-day") {
    return { start: 0, end: 23 * 60 + 59 };
  }

  if (query.timeMode === "by-shift") {
    const schedule = shiftSchedules[query.shiftIndex];
    if (!schedule || isNullShift(schedule)) return null;
    const start = parseTime(schedule.startTime);
    const end = parseTime(schedule.endTime);
    if (start == null || end == null) return null;
    return { start, end };
  }

  const start = parseTime(query.customTimeStart);
  const end = parseTime(query.customTimeEnd);
  if (start == null || end == null) return null;
  return { start, end };
}

export function filterPointsByTimeMode<T extends { timestamp: number }>(
  points: T[],
  query: RateGraphQuery,
  shiftSchedules: [ShiftSchedule, ShiftSchedule, ShiftSchedule],
): T[] {
  const window = getActiveTimeWindow(query, shiftSchedules);
  if (!window) return points;

  return points.filter((point) => {
    const date = new Date(point.timestamp);
    const dayStart = startOfDay(date).getTime();
    if (
      point.timestamp < startOfDay(query.startDate).getTime() ||
      point.timestamp > endOfDay(query.endDate).getTime()
    ) {
      return false;
    }
    return isWithinMinutesWindow(minutesOfDay(date), window.start, window.end);
  });
}

export function validateCustomTimeRange(
  timeMode: RateGraphTimeMode,
  customTimeStart: string,
  customTimeEnd: string,
): string | null {
  if (timeMode !== "custom-time") return null;
  if (parseTime(customTimeStart) == null || parseTime(customTimeEnd) == null) {
    return "Enter valid custom times in HH:MM format.";
  }
  return null;
}
