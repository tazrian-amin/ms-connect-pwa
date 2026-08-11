"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import {
  LedColumnPendingOverlay,
  LedColumnShell,
  ledSegmentSx,
  ledSegmentGlowSx,
} from "./led-column-shell";
import { GaugeFrame } from "./level-scale";
import { getPumpLedSegmentState } from "./pump-led-threshold-logic";
import { ThresholdTrack } from "./threshold-track";
import {
  gaugeSegmentCount,
  PUMP_DISABLED_OPACITY,
  PumpMonitoringPalette,
  WATER_LEVEL_SCALE,
} from "./constants";

interface PumpLevelGaugeProps {
  /** Feet over the full column; segments below it stay lit red. */
  triggerLevelLow: number;
  /** Feet over the full column; segments above it stay lit green. */
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
  /**
   * A threshold change is with the device. The pointers stay where the device
   * has them until it answers, under a waiting overlay.
   */
  pending?: boolean;
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
 * Pump LED column with its two draggable HIGH/LOW threshold sliders overlaid,
 * and a foot scale beside it. Both sliders travel the full 0–60 ft column and
 * are held a foot apart, so the lit bands they bound (red below LOW, green
 * above HIGH) can be any size short of meeting.
 *
 * The scale stands to the right of the gauge with nothing balancing it on the
 * left, so the assembly is wider on that side than the LEDs it names — see
 * PUMP_COLUMN_SCALE_INSET for how the rest of the column follows them.
 */
export function PumpLevelGauge({
  triggerLevelLow,
  triggerLevelHigh,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
  disabled = false,
  locked = false,
  pending = false,
}: PumpLevelGaugeProps) {
  const segments = useMemo(
    () =>
      Array.from({ length: gaugeSegmentCount(WATER_LEVEL_SCALE) }, (_, i) => i),
    [],
  );
  const segmentSx = ledSegmentSx(WATER_LEVEL_SCALE);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        ...(disabled ? { opacity: PUMP_DISABLED_OPACITY } : {}),
      }}
    >
      <GaugeFrame scale={WATER_LEVEL_SCALE}>
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
                  ...segmentSx,
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
          disabled={disabled || locked || pending}
        />

        {pending && <LedColumnPendingOverlay />}
      </GaugeFrame>

      <Typography sx={{ mt: 0.75, fontSize: 11, color: PumpMonitoringPalette.textMuted, fontWeight: 500 }}>
        High {triggerLevelHigh} ft
      </Typography>
      <Typography sx={{ fontSize: 11, color: PumpMonitoringPalette.textMuted, fontWeight: 500 }}>
        Low {triggerLevelLow} ft
      </Typography>
    </Box>
  );
}
