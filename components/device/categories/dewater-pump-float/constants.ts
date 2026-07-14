// Chrome tokens (backgrounds/borders/text) resolve to the same CSS variables
// as the scale dashboard (app/globals.css), which flip with the
// prefers-color-scheme signal MUI's ThemeProvider uses (app/providers.tsx) —
// this column/LED markup renders with plain CSSProperties, not MUI's sx, so
// it can't call useTheme() directly. LED/indicator/status colors stay fixed
// since they carry fixed semantic meaning independent of theme mode.
export const PumpMonitoringPalette = {
  panelBg: "var(--panel-bg)",
  columnBg: "var(--panel-bg-alt)",
  segmentInactive: "#cbd5e1",
  border: "var(--panel-border)",
  borderMuted: "var(--panel-border-muted)",
  text: "var(--panel-text)",
  textMuted: "var(--panel-text-muted)",
  waterActive: "#3b82f6",
  waterActiveGlow: "rgba(59, 130, 246, 0.45)",
  greenActive: "#10b981",
  greenActiveGlow: "rgba(16, 185, 129, 0.45)",
  redActive: "#ef4444",
  redActiveGlow: "rgba(239, 68, 68, 0.45)",
  indicatorOff: "#94a3b8",
  waterBadgeText: "#1d4ed8",
  resetButtonBg: "var(--panel-control-bg)",
  resetButtonText: "var(--panel-text)",
  thresholdPointer: "#64748b",
  thresholdPointerBorder: "#475569",
  thresholdPointerGrip: "#f1f5f9",
} as const;

export const PUMP_COUNT = 6;

export const WATER_LED_SEGMENT_COUNT = 64;
/** Bottom half of the pump column uses red; top half uses green. */
export const PUMP_LED_ZONE_SEGMENT_COUNT = WATER_LED_SEGMENT_COUNT / 2;

export const LED_COLUMN_WIDTH = 72;
export const LED_COLUMN_PADDING = 8;
export const LED_SEGMENT_HEIGHT = 6;
export const LED_SEGMENT_GAP = 2;
/** Inner track width inside the column padding. */
export const LED_SEGMENT_WIDTH =
  LED_COLUMN_WIDTH - LED_COLUMN_PADDING * 2;

/** Vertical span of the LED stack inside the column shell. */
export const LED_STACK_HEIGHT =
  WATER_LED_SEGMENT_COUNT * LED_SEGMENT_HEIGHT +
  (WATER_LED_SEGMENT_COUNT - 1) * LED_SEGMENT_GAP;

/** Column height fits the full 64-segment stack plus vertical padding. */
export const LED_COLUMN_HEIGHT = LED_STACK_HEIGHT + LED_COLUMN_PADDING * 2;

export const LED_STACK_OFFSET_Y = LED_COLUMN_PADDING;

export const LED_ZONE_DIVIDER_HEIGHT = 2;

/** Height of one green or red zone inside the pump LED stack. */
export const PUMP_LED_ZONE_HEIGHT =
  (LED_STACK_HEIGHT - LED_ZONE_DIVIDER_HEIGHT) / 2;

/** Green (HIGH) zone — top of the pump LED stack. */
export const PUMP_GREEN_ZONE_TOP = LED_STACK_OFFSET_Y;
export const PUMP_GREEN_ZONE_BOTTOM =
  LED_STACK_OFFSET_Y + PUMP_LED_ZONE_HEIGHT;

/** Red (LOW) zone — bottom of the pump LED stack. */
export const PUMP_RED_ZONE_TOP =
  LED_STACK_OFFSET_Y + PUMP_LED_ZONE_HEIGHT + LED_ZONE_DIVIDER_HEIGHT;
export const PUMP_RED_ZONE_BOTTOM = LED_STACK_OFFSET_Y + LED_STACK_HEIGHT;

export const THRESHOLD_POINTER_HEIGHT = 18;
export const THRESHOLD_POINTER_WIDTH = LED_COLUMN_WIDTH + 10;

export const DASHBOARD_MIN_WIDTH = 920;
export const COLUMN_GAP = 20;
