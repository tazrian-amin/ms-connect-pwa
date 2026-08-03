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
import { ThresholdTrack, type ThresholdPointerText } from "./threshold-track";
import {
  LED_COLUMN_HEIGHT,
  LED_COLUMN_WIDTH,
  PumpMonitoringPalette,
  WATER_LED_SEGMENT_COUNT,
  WATER_TITLE_GUTTER,
} from "./constants";

/**
 * The water column names its band Max/Min, matching the telemetry chart's
 * threshold legend. The pump columns keep the firmware's HIGH/LOW wording.
 */
const WATER_POINTER_TEXT: ThresholdPointerText = { high: "MAX", low: "MIN" };

interface WaterLevelColumnProps {
  waterLevel: number;
  /** 0–100 over the full column; never drops below the MIN threshold. */
  triggerLevelHigh: number;
  /** 0–100 over the full column; never rises above the MAX threshold. */
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
  const clamped = Math.min(100, Math.max(0, waterLevel));
  const activeCount = Math.round((clamped / 100) * WATER_LED_SEGMENT_COUNT);
  const segments = useMemo(
    () => Array.from({ length: WATER_LED_SEGMENT_COUNT }, (_, i) => i),
    [],
  );

  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
      {/* Reads bottom-to-top up the gauge, the way the level itself climbs.
          Centered on the gauge alone, so it stays put as the readouts
          underneath change height. */}
      <Box
        sx={{
          width: WATER_TITLE_GUTTER,
          height: LED_COLUMN_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
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
          Water Level
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
            pointerText={WATER_POINTER_TEXT}
            triggerLevelHigh={triggerLevelHigh}
            triggerLevelLow={triggerLevelLow}
            onTriggerLevelHighChange={onTriggerLevelHighChange}
            onTriggerLevelLowChange={onTriggerLevelLowChange}
            disabled={locked || pending}
          />

          {pending && <LedColumnPendingOverlay />}
        </Box>

        <Typography sx={{ mt: 0.75, fontSize: 11, color: PumpMonitoringPalette.textMuted, fontWeight: 500 }}>
          Max {triggerLevelHigh}%
        </Typography>
        <Typography sx={{ fontSize: 11, color: PumpMonitoringPalette.textMuted, fontWeight: 500 }}>
          Min {triggerLevelLow}%
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

      {/* Balances the vertical title's gutter, so the column is symmetric about
          its gauge. Centering the column in the grid then puts the gauge itself
          on the same axis as the three row labels above it — without this the
          title would drag everything a gutter's width to the right. */}
      <Box sx={{ width: WATER_TITLE_GUTTER }} />
    </Box>
  );
}
