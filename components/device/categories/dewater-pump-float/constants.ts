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
  /** Low/min end of a range — pairs with redActive for the high/max end. */
  amberActive: "#f59e0b",
  indicatorOff: "#94a3b8",
  waterBadgeText: "#1d4ed8",
  resetButtonBg: "var(--panel-control-bg)",
  resetButtonText: "var(--panel-text)",
  /**
   * What a reset button turns on hover. Neutral at rest so it doesn't shout
   * from a dashboard nobody is touching, and destructive-red under the pointer,
   * where it is about to be pressed — the same red the confirmation's own Reset
   * carries, so the two read as one action.
   */
  resetButtonHoverBg: "var(--panel-danger-bg)",
  resetButtonHoverBorder: "var(--panel-danger-border)",
  resetButtonHoverText: "var(--panel-danger-text)",
  /** Tint behind the "Enable Edits" toggle while edits are unlocked. */
  editUnlockedBg: "rgba(16, 185, 129, 0.14)",
  /** Informational notice pill. Nothing on the dashboard uses one today. */
  noticeBg: "var(--panel-notice-bg)",
  noticeBorder: "var(--panel-notice-border)",
  noticeText: "var(--panel-notice-text)",
  /** Start-count badge on each pump column. */
  startsBadgeBg: "var(--panel-bg)",
  startsBadgeText: "var(--panel-text-muted)",
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

/**
 * Minutes a pump must stay off before it may restart. Held in the UI only —
 * the firmware has no echo for it yet — so this is where it starts, and 0
 * (no restart delay) matches the firmware's own default.
 */
export const PUMP_MIN_OFF_TIME_DEFAULT = 0;

export const COLUMN_GAP = 20;

/**
 * Width of one pump's grid column. Fixed rather than content-sized: the three
 * header rows and the gauge body are separate grid rows, and they only read as
 * one column each if every row tracks the same width. Wide enough for the
 * longest status label ("Disabled") beside its dot.
 */
export const PUMP_COLUMN_WIDTH = 110;

/**
 * Height of the pump status pill. Fixed so the row keeps its height whichever
 * status each pump is in.
 */
export const STATUS_INDICATOR_HEIGHT = 42;

/** Height of the enable/disable switch row, same reason. */
export const PUMP_TOGGLE_HEIGHT = 30;

/** Height of the pump title row ("#1"–"#6"), same reason. */
export const COLUMN_TITLE_HEIGHT = 24;

/** Width taken by the water column's vertical title, left of its gauge. */
export const WATER_TITLE_GUTTER = 12;

/** Dimming applied to a disabled pump column's readouts and gauge. */
export const PUMP_DISABLED_OPACITY = 0.5;
