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
import { ThresholdTrack, type ThresholdPointerText } from "./threshold-track";
import { valueToSegmentIndex } from "./threshold-track-math";
import {
  gaugeSegmentCount,
  PumpMonitoringPalette,
  WATER_LEVEL_SCALE,
} from "./constants";

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
  const feet = valueToSegmentIndex(WATER_LEVEL_SCALE, waterLevel);
  const segments = useMemo(
    () =>
      Array.from({ length: gaugeSegmentCount(WATER_LEVEL_SCALE) }, (_, i) => i),
    [],
  );
  const segmentSx = ledSegmentSx(WATER_LEVEL_SCALE);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <GaugeFrame
        scale={WATER_LEVEL_SCALE}
        /* Reads bottom-to-top up the gauge, the way the level itself climbs,
           in a gutter of its own against the LEDs it names. Centered on the
           gauge alone, so it stays put as the readouts underneath change
           height. */
        title={
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
                  ...segmentSx,
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
      </GaugeFrame>

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
