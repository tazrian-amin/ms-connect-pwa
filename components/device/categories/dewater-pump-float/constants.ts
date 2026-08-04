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

/**
 * Depth of the shaft the columns measure, and so the full travel of every
 * level on this dashboard: the water reading, the water column's own band, and
 * each pump column's two trigger levels are all depths in feet over 0–this.
 *
 * The device speaks the same unit — see the firmware's kWaterLevelMaxFeet — so
 * nothing is converted between here and the wire.
 */
export const WATER_LEVEL_MAX_FEET = 60;

/** One LED segment is one foot, which is what makes the columns readable. */
export const LED_SEGMENT_COUNT = WATER_LEVEL_MAX_FEET;

export const LED_COLUMN_WIDTH = 72;
export const LED_COLUMN_PADDING = 8;
export const LED_SEGMENT_HEIGHT = 6;
export const LED_SEGMENT_GAP = 2;
/** Inner track width inside the column padding. */
export const LED_SEGMENT_WIDTH =
  LED_COLUMN_WIDTH - LED_COLUMN_PADDING * 2;

/** Vertical span of the LED stack inside the column shell. */
export const LED_STACK_HEIGHT =
  LED_SEGMENT_COUNT * LED_SEGMENT_HEIGHT +
  (LED_SEGMENT_COUNT - 1) * LED_SEGMENT_GAP;

/** Column height fits the full foot-per-segment stack plus vertical padding. */
export const LED_COLUMN_HEIGHT = LED_STACK_HEIGHT + LED_COLUMN_PADDING * 2;

export const LED_STACK_OFFSET_Y = LED_COLUMN_PADDING;

/**
 * The foot scale drawn beside every gauge — see LevelScale. Ticks run down the
 * left of the gutter and their labels sit to the right of the long ones, so
 * the gutter has to hold the longest tick plus a two-digit label.
 */
export const LEVEL_SCALE_WIDTH = 30;
/**
 * Between a gauge and its scale. The threshold pointers cross it to reach the
 * ticks — see THRESHOLD_POINTER_LEFT — so it is sized for them rather than as
 * free space.
 */
export const LEVEL_SCALE_GAP = 8;
/** Tick lengths: every foot, every fifth foot, and every labelled tenth. */
export const LEVEL_SCALE_TICK_MINOR = 4;
export const LEVEL_SCALE_TICK_MID = 7;
export const LEVEL_SCALE_TICK_MAJOR = 10;
/** Feet between long ticks, and between the labelled ones. */
export const LEVEL_SCALE_MID_STEP = 5;
export const LEVEL_SCALE_LABEL_STEP = 10;

/**
 * Both threshold sliders travel the whole LED stack — 0 ft = bottom segment,
 * 60 ft = top segment — so their values read as absolute water depths.
 */
export const THRESHOLD_TRACK_TOP = LED_STACK_OFFSET_Y;
export const THRESHOLD_TRACK_HEIGHT = LED_STACK_HEIGHT;

export const THRESHOLD_POINTER_HEIGHT = 18;
export const THRESHOLD_POINTER_WIDTH = LED_COLUMN_WIDTH + 10;
/** Arrowhead carrying the pill's reading across to the scale. */
export const THRESHOLD_POINTER_ARROW_WIDTH = 6;
export const THRESHOLD_POINTER_ARROW_HEIGHT = 10;
/**
 * Left edge of the label pill, derived rather than centred: the pill and its
 * arrowhead are placed as one, so that the tip lands exactly on the line the
 * scale's ticks start at. That is what lets a threshold be read off the scale
 * while it is being dragged, instead of only from the readout underneath once
 * it has been dropped.
 *
 * The pill gives up the arrow's width on its right and takes it back on its
 * left, so pill-plus-arrow still sits centred on the column.
 */
export const THRESHOLD_POINTER_LEFT =
  LED_COLUMN_WIDTH +
  LEVEL_SCALE_GAP -
  THRESHOLD_POINTER_ARROW_WIDTH -
  THRESHOLD_POINTER_WIDTH;
/**
 * Exact-threshold marker drawn under the label pill. It runs the width of the
 * column *and* the gap beyond it, up to the ticks — so the depth stays exactly
 * marked against the scale even where the pills have been nudged off it (see
 * resolveThresholdLayout).
 */
export const THRESHOLD_MARKER_HEIGHT = 2;
export const THRESHOLD_MARKER_WIDTH = LED_COLUMN_WIDTH + LEVEL_SCALE_GAP;
/** Kept between the two label pills once the thresholds converge. */
export const THRESHOLD_POINTER_MIN_GAP = 2;

/**
 * Feet a column's HIGH threshold is held above its LOW one. The two used to be
 * free to meet, which left the pump with no dead band at all — it would start
 * and stop at the same depth and chatter around it. One foot is the smallest
 * separation the scale can state, so it is the smallest the sliders allow.
 */
export const THRESHOLD_MIN_SEPARATION_FEET = 1;

/**
 * Water column's own trigger band, in feet. Where the dashboard starts before
 * the device reports its own — see readWaterBand.
 */
export const WATER_TRIGGER_LEVEL_HIGH_DEFAULT = 45;
export const WATER_TRIGGER_LEVEL_LOW_DEFAULT = 15;

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
 * one column each if every row tracks the same width.
 *
 * A scale's width is counted twice — once for the scale itself, once for the
 * blank gutter mirroring it on the other side of the gauge. That gutter is
 * what keeps the LEDs on the column's centre line, under the switch, number
 * and status pill above them, instead of the scale shoving them left.
 */
export const PUMP_COLUMN_WIDTH =
  LED_COLUMN_WIDTH + 2 * (LEVEL_SCALE_WIDTH + LEVEL_SCALE_GAP);

/**
 * Height of the pump status pill. Fixed so the row keeps its height whichever
 * status each pump is in.
 */
export const STATUS_INDICATOR_HEIGHT = 42;

/**
 * How wide that pill may grow. The grid column carries the gauge *and* the
 * scale beside it, so a pill filling the column would run twice the width of
 * the gauge it names. Capped at the gauge plus one scale gutter, it stays
 * centred on the LEDs and reads as belonging to them.
 */
export const STATUS_INDICATOR_MAX_WIDTH =
  LED_COLUMN_WIDTH + LEVEL_SCALE_WIDTH + LEVEL_SCALE_GAP;

/** Height of the enable/disable switch row, same reason. */
export const PUMP_TOGGLE_HEIGHT = 30;

/** Height of the pump title row ("#1"–"#6"), same reason. */
export const COLUMN_TITLE_HEIGHT = 24;

/** Dimming applied to a disabled pump column's readouts and gauge. */
export const PUMP_DISABLED_OPACITY = 0.5;
