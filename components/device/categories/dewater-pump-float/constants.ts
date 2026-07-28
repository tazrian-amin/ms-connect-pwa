// Chrome tokens reuse the scale dashboard's CSS variables (app/globals.css) so
// they flip with theme mode even though this markup uses plain CSSProperties,
// not MUI's sx/useTheme(). LED/indicator/status colors stay fixed regardless
// of theme since they carry fixed semantic meaning.
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

/**
 * Both threshold sliders travel the whole LED stack — 0 = bottom segment,
 * 100 = top segment — so their values read as absolute water-level percent.
 */
export const THRESHOLD_TRACK_TOP = LED_STACK_OFFSET_Y;
export const THRESHOLD_TRACK_HEIGHT = LED_STACK_HEIGHT;

export const THRESHOLD_POINTER_HEIGHT = 18;
export const THRESHOLD_POINTER_WIDTH = LED_COLUMN_WIDTH + 10;
/** Exact-threshold marker drawn under the label pill. */
export const THRESHOLD_MARKER_HEIGHT = 2;
/** Kept between the two label pills once the thresholds converge. */
export const THRESHOLD_POINTER_MIN_GAP = 2;

/**
 * Water column's own trigger band. Held in the UI only — the retrofit float
 * command set has no key for it yet — so these are where it starts.
 */
export const WATER_TRIGGER_LEVEL_HIGH_DEFAULT = 75;
export const WATER_TRIGGER_LEVEL_LOW_DEFAULT = 25;

export const DASHBOARD_MIN_WIDTH = 920;
export const COLUMN_GAP = 20;

/**
 * Height of the pump ON/OFF pill. Fixed so the water column can reserve the
 * same space and keep every gauge top-aligned.
 */
export const STATUS_INDICATOR_HEIGHT = 42;

/** Height of the enable/disable switch row above each pump title, same reason. */
export const PUMP_TOGGLE_HEIGHT = 30;

/** Dimming applied to a disabled pump column's readouts and gauge. */
export const PUMP_DISABLED_OPACITY = 0.5;
