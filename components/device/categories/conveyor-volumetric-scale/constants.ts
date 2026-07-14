// Chrome tokens (backgrounds/borders/text) resolve to CSS variables defined
// in app/globals.css, which flip with the same prefers-color-scheme signal
// MUI's ThemeProvider uses (see app/providers.tsx) — this row/gauge/status
// markup renders with plain CSSProperties, not MUI's sx, so it can't call
// useTheme() directly. Status/indicator colors (LED, state, accent) stay
// fixed since they carry fixed semantic meaning independent of theme mode.
export const ScalePalette = {
  panelBg: "var(--panel-bg)",
  rowBg: "var(--panel-bg-alt)",
  rowAltBg: "var(--panel-bg)",
  border: "var(--panel-border)",
  borderMuted: "var(--panel-border-muted)",
  text: "var(--panel-text)",
  textMuted: "var(--panel-text-muted)",
  textLight: "#ffffff",
  headerBg: "var(--panel-bg)",
  totalRowBg: "#4a4a4a",
  onlineDot: "#22c55e",
  segmentInactive: "#5c5c5c",
  segmentLight: "#e8eaed",
  stateOrange: "#e8913a",
  stateGreen: "#3d9e48",
  stateRed: "#d94040",
  goalTrack: "var(--panel-border)",
  goalProgress: "#d94040",
  buttonBg: "var(--panel-control-bg)",
  buttonText: "var(--panel-text)",
  settingsIcon: "#4cb1e5",
  notesIcon: "var(--panel-text-muted)",
} as const;

export const SCALE_STATUS_LABELS = {
  offline: "OFFLINE",
  "stopped-belt": "STOPPED BELT",
  "black-belt": "BLACK BELT",
  "below-range": "BELOW RANGE",
  "optimum-range": "OPTIMUM RANGE",
  "above-range": "ABOVE RANGE",
} as const;

export const ROW_HEIGHT = 100;
export const COL_GAP = 20;
export const COL_NAME_WIDTH = 268;
export const COL_READINGS_WIDTH = 340;
export const COL_GOAL_WIDTH = 104;
export const COL_PRODUCTION_WIDTH = 180;
export const COL_NOTES_WIDTH = 56;
