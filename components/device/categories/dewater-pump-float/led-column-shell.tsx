import type { CSSProperties, ReactNode } from "react";

import {
  LED_COLUMN_HEIGHT,
  LED_COLUMN_WIDTH,
  LED_COLUMN_PADDING,
  LED_SEGMENT_GAP,
  LED_SEGMENT_HEIGHT,
  LED_SEGMENT_WIDTH,
  PumpMonitoringPalette,
} from "./constants";

interface LedColumnShellProps {
  children: ReactNode;
  style?: CSSProperties;
}

/** Shared segment bar dimensions (full width of the inner track). */
export const ledSegmentBaseStyle: CSSProperties = {
  width: LED_SEGMENT_WIDTH,
  height: LED_SEGMENT_HEIGHT,
  borderRadius: LED_SEGMENT_HEIGHT / 2,
};

/** Glow applied to a lit segment; mirrors the RN shadow-based glow. */
export function ledSegmentActiveStyle(glowColor?: string): CSSProperties {
  return glowColor ? { boxShadow: `0 0 6px ${glowColor}` } : {};
}

/** Fixed-height column with the LED stack vertically centered inside. */
export function LedColumnShell({ children, style }: LedColumnShellProps) {
  return (
    <div style={{ ...columnStyle, ...style }}>
      <div style={segmentStackStyle}>{children}</div>
    </div>
  );
}

const columnStyle: CSSProperties = {
  height: LED_COLUMN_HEIGHT,
  width: LED_COLUMN_WIDTH,
  backgroundColor: PumpMonitoringPalette.columnBg,
  borderRadius: LED_COLUMN_WIDTH / 6,
  border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
  padding: LED_COLUMN_PADDING,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  overflow: "hidden",
};

const segmentStackStyle: CSSProperties = {
  width: LED_SEGMENT_WIDTH,
  display: "flex",
  flexDirection: "column-reverse",
  gap: LED_SEGMENT_GAP,
};
