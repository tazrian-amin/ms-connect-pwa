"use client";

import { Fragment, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import {
  LedColumnShell,
  ledSegmentBaseSx,
  ledSegmentGlowSx,
} from "./led-column-shell";
import { isPumpLedSegmentActive } from "./pump-led-threshold-logic";
import { PumpThresholdPointer } from "./pump-threshold-pointer";
import {
  LED_COLUMN_HEIGHT,
  LED_COLUMN_WIDTH,
  LED_ZONE_DIVIDER_HEIGHT,
  PUMP_GREEN_ZONE_BOTTOM,
  PUMP_GREEN_ZONE_TOP,
  PUMP_LED_ZONE_SEGMENT_COUNT,
  PUMP_RED_ZONE_BOTTOM,
  PUMP_RED_ZONE_TOP,
  PumpMonitoringPalette,
  WATER_LED_SEGMENT_COUNT,
} from "./constants";

interface PumpLevelGaugeProps {
  /** 0–100 within the red (LOW) zone; bottom portion stays lit. */
  triggerLevelLow: number;
  /** 0–100 within the green (HIGH) zone; bottom portion stays dark. */
  triggerLevelHigh: number;
  onTriggerLevelHighChange: (level: number) => void;
  onTriggerLevelLowChange: (level: number) => void;
}

/**
 * Pump LED column (red zone bottom, divider, green zone top) with its two
 * draggable HIGH/LOW threshold sliders overlaid. LEDs between the LOW and
 * HIGH thresholds are off; the outer bands are on.
 */
export function PumpLevelGauge({
  triggerLevelLow,
  triggerLevelHigh,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
}: PumpLevelGaugeProps) {
  const segments = useMemo(
    () => Array.from({ length: WATER_LED_SEGMENT_COUNT }, (_, i) => i),
    [],
  );

  return (
    <Box sx={{ width: LED_COLUMN_WIDTH, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <Box sx={{ width: LED_COLUMN_WIDTH, height: LED_COLUMN_HEIGHT, position: "relative" }}>
        <LedColumnShell>
          {segments.map((index) => {
            const active = isPumpLedSegmentActive(index, triggerLevelLow, triggerLevelHigh);
            const inRedZone = index < PUMP_LED_ZONE_SEGMENT_COUNT;
            const activeColor = inRedZone ? PumpMonitoringPalette.redActive : PumpMonitoringPalette.greenActive;
            const activeGlow = inRedZone ? PumpMonitoringPalette.redActiveGlow : PumpMonitoringPalette.greenActiveGlow;

            return (
              <Fragment key={index}>
                {index === PUMP_LED_ZONE_SEGMENT_COUNT ? (
                  <Box
                    sx={{
                      width: "100%",
                      height: LED_ZONE_DIVIDER_HEIGHT,
                      borderRadius: "1px",
                      bgcolor: PumpMonitoringPalette.borderMuted,
                      my: "1px",
                    }}
                  />
                ) : null}
                <Box
                  sx={{
                    ...ledSegmentBaseSx,
                    bgcolor: active ? activeColor : PumpMonitoringPalette.segmentInactive,
                    ...(active ? ledSegmentGlowSx(activeGlow) : {}),
                  }}
                />
              </Fragment>
            );
          })}
        </LedColumnShell>

        <PumpThresholdPointer
          label="HIGH"
          value={triggerLevelHigh}
          zoneTop={PUMP_GREEN_ZONE_TOP}
          zoneBottom={PUMP_GREEN_ZONE_BOTTOM}
          onValueChange={onTriggerLevelHighChange}
        />
        <PumpThresholdPointer
          label="LOW"
          value={triggerLevelLow}
          zoneTop={PUMP_RED_ZONE_TOP}
          zoneBottom={PUMP_RED_ZONE_BOTTOM}
          onValueChange={onTriggerLevelLowChange}
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
