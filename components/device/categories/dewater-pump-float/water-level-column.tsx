"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import {
  LedColumnShell,
  ledSegmentBaseSx,
  ledSegmentGlowSx,
} from "./led-column-shell";
import { PumpMonitoringPalette, WATER_LED_SEGMENT_COUNT } from "./constants";

interface WaterLevelColumnProps {
  waterLevel: number;
}

/** Segments render bottom-to-top; index 0 is the lowest LED. */
export function WaterLevelColumn({ waterLevel }: WaterLevelColumnProps) {
  const clamped = Math.min(100, Math.max(0, waterLevel));
  const activeCount = Math.round((clamped / 100) * WATER_LED_SEGMENT_COUNT);
  const segments = useMemo(
    () => Array.from({ length: WATER_LED_SEGMENT_COUNT }, (_, i) => i),
    [],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 88 }}>
      <Typography sx={{ color: PumpMonitoringPalette.text, fontSize: 16, fontWeight: 600, mb: 2 }}>
        Water Level
      </Typography>

      <LedColumnShell>
        {segments.map((index) => {
          const active = index < activeCount;
          return (
            <Box
              key={index}
              sx={{
                ...ledSegmentBaseSx,
                bgcolor: active ? PumpMonitoringPalette.waterActive : PumpMonitoringPalette.segmentInactive,
                ...(active ? ledSegmentGlowSx(PumpMonitoringPalette.waterActiveGlow) : {}),
              }}
            />
          );
        })}
      </LedColumnShell>

      <Box
        sx={{
          mt: 2,
          bgcolor: PumpMonitoringPalette.columnBg,
          border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
          borderRadius: "12px",
          px: 2,
          py: 1,
        }}
      >
        <Typography sx={{ color: PumpMonitoringPalette.waterBadgeText, fontSize: 16, fontWeight: 600 }}>
          {clamped}%
        </Typography>
      </Box>
    </Box>
  );
}
