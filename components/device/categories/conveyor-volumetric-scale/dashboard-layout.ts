import {
  COL_GAP,
  COL_GOAL_WIDTH,
  COL_NAME_WIDTH,
  COL_NOTES_WIDTH,
  COL_PRODUCTION_WIDTH,
  COL_READINGS_WIDTH,
} from "./constants";

const ROW_HORIZONTAL_PADDING = 24;

export type ScaleDashboardColumns = {
  name: number;
  readings: number;
  goal: number;
  production: number;
  notes: number;
};

export type ScaleDashboardLayout = {
  contentWidth: number;
  scrollEnabled: boolean;
  /** Below this width, rows/sections render as stacked cards instead of a table. */
  stacked: boolean;
  columns: ScaleDashboardColumns;
};

/** Phones and narrow tablets stack; anything wider gets the tabular layout. */
const MOBILE_BREAKPOINT = 720;

export function getMinDashboardContentWidth(): number {
  return (
    COL_NAME_WIDTH +
    COL_READINGS_WIDTH +
    COL_GOAL_WIDTH +
    COL_PRODUCTION_WIDTH +
    COL_NOTES_WIDTH +
    COL_GAP * 4 +
    ROW_HORIZONTAL_PADDING
  );
}

/** Sizes dashboard columns to fill `availableWidth`, scrolling only when needed. */
export function getDashboardLayout(availableWidth: number): ScaleDashboardLayout {
  const minContentWidth = getMinDashboardContentWidth();
  const effectiveWidth =
    availableWidth > 0 ? availableWidth : minContentWidth;
  const stacked = effectiveWidth < MOBILE_BREAKPOINT;
  const contentWidth = Math.max(effectiveWidth, minContentWidth);
  const extraReadings = contentWidth - minContentWidth;

  return {
    contentWidth,
    scrollEnabled: !stacked && effectiveWidth < minContentWidth,
    stacked,
    columns: {
      name: COL_NAME_WIDTH,
      readings: COL_READINGS_WIDTH + extraReadings,
      goal: COL_GOAL_WIDTH,
      production: COL_PRODUCTION_WIDTH,
      notes: COL_NOTES_WIDTH,
    },
  };
}
