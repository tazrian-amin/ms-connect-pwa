"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import {
  LedColumnShell,
  ledSegmentBaseSx,
  ledSegmentGlowSx,
} from "./led-column-shell";
import { getPumpLedSegmentState } from "./pump-led-threshold-logic";
import { ThresholdTrack } from "./threshold-track";
import {
  LED_COLUMN_HEIGHT,
  LED_COLUMN_WIDTH,
  PUMP_DISABLED_OPACITY,
  PumpMonitoringPalette,
  WATER_LED_SEGMENT_COUNT,
} from "./constants";

interface PumpLevelGaugeProps {
  /** 0–100 over the full column; segments below it stay lit red. */
  triggerLevelLow: number;
  /** 0–100 over the full column; segments above it stay lit green. */
  triggerLevelHigh: number;
  onTriggerLevelHighChange: (level: number) => void;
  onTriggerLevelLowChange: (level: number) => void;
  /** Drops the band colors and locks the sliders — the pump is switched off. */
  disabled?: boolean;
  /**
   * Locks the sliders without dimming anything — the dashboard is read-only,
   * so the gauge keeps reading as normal.
   */
  locked?: boolean;
}

const SEGMENT_COLORS = {
  red: {
    color: PumpMonitoringPalette.redActive,
    glow: PumpMonitoringPalette.redActiveGlow,
  },
  green: {
    color: PumpMonitoringPalette.greenActive,
    glow: PumpMonitoringPalette.greenActiveGlow,
  },
  off: { color: PumpMonitoringPalette.segmentInactive, glow: undefined },
} as const;

/**
 * Pump LED column with its two draggable HIGH/LOW threshold sliders overlaid.
 * Both sliders travel the full column and may meet but not cross, so the lit
 * bands they bound (red below LOW, green above HIGH) can be any size.
 */
export function PumpLevelGauge({
  triggerLevelLow,
  triggerLevelHigh,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
  disabled = false,
  locked = false,
}: PumpLevelGaugeProps) {
  const segments = useMemo(
    () => Array.from({ length: WATER_LED_SEGMENT_COUNT }, (_, i) => i),
    [],
  );

  return (
    <Box
      sx={{
        width: LED_COLUMN_WIDTH,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...(disabled ? { opacity: PUMP_DISABLED_OPACITY } : {}),
      }}
    >
      <Box sx={{ width: LED_COLUMN_WIDTH, height: LED_COLUMN_HEIGHT, position: "relative" }}>
        <LedColumnShell>
          {segments.map((index) => {
            // A disabled pump keeps its band boundaries visible through the
            // slider pointers only — every segment reads as unlit.
            const { color, glow } = disabled
              ? SEGMENT_COLORS.off
              : SEGMENT_COLORS[
                  getPumpLedSegmentState(index, triggerLevelLow, triggerLevelHigh)
                ];

            return (
              <Box
                key={index}
                sx={{
                  ...ledSegmentBaseSx,
                  bgcolor: color,
                  ...ledSegmentGlowSx(glow),
                }}
              />
            );
          })}
        </LedColumnShell>

        <ThresholdTrack
          name="Pump"
          triggerLevelHigh={triggerLevelHigh}
          triggerLevelLow={triggerLevelLow}
          onTriggerLevelHighChange={onTriggerLevelHighChange}
          onTriggerLevelLowChange={onTriggerLevelLowChange}
          disabled={disabled || locked}
        />
      </Box>

      <Typography sx={{ mt: 0.75, fontSize: 11, color: PumpMonitoringPalette.textMuted, fontWeight: 500 }}>
        High {triggerLevelHigh}%
      </Typography>
      <Typography sx={{ fontSize: 11, color: PumpMonitoringPalette.textMuted, fontWeight: 500 }}>
        Low {triggerLevelLow}%
      </Typography>
    </Box>
  );
}
