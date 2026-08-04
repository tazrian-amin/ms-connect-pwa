"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import {
  LedColumnPendingOverlay,
  LedColumnShell,
  ledSegmentBaseSx,
  ledSegmentGlowSx,
} from "./led-column-shell";
import { GaugeWithScale } from "./level-scale";
import { ThresholdTrack, type ThresholdPointerText } from "./threshold-track";
import { clampFeet } from "./threshold-track-math";
import { LED_SEGMENT_COUNT, PumpMonitoringPalette } from "./constants";

/**
 * The water column names its band Max/Min, matching the telemetry chart's
 * threshold legend. The pump columns keep the firmware's HIGH/LOW wording.
 */
const WATER_POINTER_TEXT: ThresholdPointerText = { high: "MAX", low: "MIN" };

interface WaterLevelColumnProps {
  /** Live depth in feet, 0–60 over the full column. */
  waterLevel: number;
  /** Feet over the full column; stays a foot above the MIN threshold. */
  triggerLevelHigh: number;
  /** Feet over the full column; stays a foot below the MAX threshold. */
  triggerLevelLow: number;
  onTriggerLevelHighChange: (level: number) => void;
  onTriggerLevelLowChange: (level: number) => void;
  /** Pointers still mark the band, but can't be dragged. */
  locked?: boolean;
  /**
   * A band change is with the device. The pointers stay where the device has
   * them until it answers, under a waiting overlay.
   */
  pending?: boolean;
}

/**
 * Live water level, with its own MAX/MIN threshold sliders overlaid. These
 * are independent of the per-pump triggers: the LEDs keep showing the raw
 * level, and the pointers only mark this column's own band.
 *
 * Sits in the dashboard grid's first column, under the three row labels — so
 * it names itself up the side of its gauge rather than from a title line.
 */
export function WaterLevelColumn({
  waterLevel,
  triggerLevelHigh,
  triggerLevelLow,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
  locked = false,
  pending = false,
}: WaterLevelColumnProps) {
  // One segment per foot, so the count of lit LEDs *is* the depth in feet.
  const feet = Math.round(clampFeet(waterLevel));
  const segments = useMemo(
    () => Array.from({ length: LED_SEGMENT_COUNT }, (_, i) => i),
    [],
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <GaugeWithScale
        /* Reads bottom-to-top up the gauge, the way the level itself climbs,
           and stands in the gutter that balances the scale — so it sits right
           against the LEDs it names. Centered on the gauge alone, so it stays
           put as the readouts underneath change height. */
        gutter={
          <Typography
            sx={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              color: PumpMonitoringPalette.text,
              fontSize: 16,
              fontWeight: 600,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            Water Level (ft)
          </Typography>
        }
      >
        <LedColumnShell>
          {segments.map((index) => {
            const active = index < feet;
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
          pointerText={WATER_POINTER_TEXT}
          triggerLevelHigh={triggerLevelHigh}
          triggerLevelLow={triggerLevelLow}
          onTriggerLevelHighChange={onTriggerLevelHighChange}
          onTriggerLevelLowChange={onTriggerLevelLowChange}
          disabled={locked || pending}
        />

        {pending && <LedColumnPendingOverlay />}
      </GaugeWithScale>

      <Typography sx={{ mt: 0.75, fontSize: 11, color: PumpMonitoringPalette.textMuted, fontWeight: 500 }}>
        Max {triggerLevelHigh} ft
      </Typography>
      <Typography sx={{ fontSize: 11, color: PumpMonitoringPalette.textMuted, fontWeight: 500 }}>
        Min {triggerLevelLow} ft
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
          {feet} ft
        </Typography>
      </Box>
    </Box>
  );
}
