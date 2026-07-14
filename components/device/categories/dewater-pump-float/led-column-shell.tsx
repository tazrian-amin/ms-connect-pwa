import type { ReactNode } from "react";
import Box, { type BoxProps } from "@mui/material/Box";

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
  sx?: BoxProps["sx"];
}

/** Shared segment bar dimensions (full width of the inner track). */
export const ledSegmentBaseSx = {
  width: LED_SEGMENT_WIDTH,
  height: LED_SEGMENT_HEIGHT,
  borderRadius: `${LED_SEGMENT_HEIGHT / 2}px`,
} as const;

/** Glow applied to a lit segment; mirrors the RN shadow-based glow. */
export function ledSegmentGlowSx(glowColor?: string): { boxShadow?: string } {
  return glowColor ? { boxShadow: `0 0 6px ${glowColor}` } : {};
}

/** Fixed-height column with the LED stack vertically centered inside. */
export function LedColumnShell({ children, sx }: LedColumnShellProps) {
  return (
    <Box
      sx={{
        height: LED_COLUMN_HEIGHT,
        width: LED_COLUMN_WIDTH,
        bgcolor: PumpMonitoringPalette.columnBg,
        borderRadius: `${LED_COLUMN_WIDTH / 6}px`,
        border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
        p: `${LED_COLUMN_PADDING}px`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        ...sx,
      }}
    >
      <Box
        sx={{
          width: LED_SEGMENT_WIDTH,
          display: "flex",
          flexDirection: "column-reverse",
          gap: `${LED_SEGMENT_GAP}px`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
