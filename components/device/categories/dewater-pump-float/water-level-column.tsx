"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import {
  LedColumnShell,
  ledSegmentBaseSx,
  ledSegmentGlowSx,
} from "./led-column-shell";
import { ThresholdTrack } from "./threshold-track";
import {
  LED_COLUMN_HEIGHT,
  LED_COLUMN_WIDTH,
  PumpMonitoringPalette,
  WATER_LED_SEGMENT_COUNT,
} from "./constants";

interface WaterLevelColumnProps {
  waterLevel: number;
  /** 0–100 over the full column; never drops below the LOW threshold. */
  triggerLevelHigh: number;
  /** 0–100 over the full column; never rises above the HIGH threshold. */
  triggerLevelLow: number;
  onTriggerLevelHighChange: (level: number) => void;
  onTriggerLevelLowChange: (level: number) => void;
}

/**
 * Live water level, with its own HIGH/LOW threshold sliders overlaid. These
 * are independent of the per-pump triggers: the LEDs keep showing the raw
 * level, and the pointers only mark this column's own band.
 */
export function WaterLevelColumn({
  waterLevel,
  triggerLevelHigh,
  triggerLevelLow,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
}: WaterLevelColumnProps) {
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

      <Box sx={{ width: LED_COLUMN_WIDTH, height: LED_COLUMN_HEIGHT, position: "relative" }}>
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

        <ThresholdTrack
          name="Water level"
          triggerLevelHigh={triggerLevelHigh}
          triggerLevelLow={triggerLevelLow}
          onTriggerLevelHighChange={onTriggerLevelHighChange}
          onTriggerLevelLowChange={onTriggerLevelLowChange}
        />
      </Box>

      <Typography sx={{ mt: 0.75, fontSize: 11, color: PumpMonitoringPalette.textMuted, fontWeight: 500 }}>
        High {triggerLevelHigh}%
      </Typography>
      <Typography sx={{ fontSize: 11, color: PumpMonitoringPalette.textMuted, fontWeight: 500 }}>
        Low {triggerLevelLow}%
      </Typography>

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
