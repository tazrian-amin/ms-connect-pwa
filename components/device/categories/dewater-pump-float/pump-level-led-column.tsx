"use client";

import { Fragment, useMemo, type CSSProperties } from "react";

import {
  LedColumnShell,
  ledSegmentActiveStyle,
  ledSegmentBaseStyle,
} from "./led-column-shell";
import { isPumpLedSegmentActive } from "./pump-led-threshold-logic";
import {
  LED_ZONE_DIVIDER_HEIGHT,
  PUMP_LED_ZONE_SEGMENT_COUNT,
  PumpMonitoringPalette,
  WATER_LED_SEGMENT_COUNT,
} from "./constants";

interface PumpLevelLedColumnProps {
  /** 0–100 within the red (LOW) zone; bottom portion stays lit. */
  triggerLevelLow: number;
  /** 0–100 within the green (HIGH) zone; bottom portion stays dark. */
  triggerLevelHigh: number;
}

/**
 * Pump LED column: red zone (bottom), divider, green zone (top).
 * LEDs between LOW and HIGH thresholds are off; outer bands are on.
 */
export function PumpLevelLedColumn({
  triggerLevelLow,
  triggerLevelHigh,
}: PumpLevelLedColumnProps) {
  const segments = useMemo(
    () => Array.from({ length: WATER_LED_SEGMENT_COUNT }, (_, i) => i),
    [],
  );

  return (
    <LedColumnShell>
      {segments.map((index) => {
        const active = isPumpLedSegmentActive(
          index,
          triggerLevelLow,
          triggerLevelHigh,
        );
        const inRedZone = index < PUMP_LED_ZONE_SEGMENT_COUNT;
        const activeColor = inRedZone
          ? PumpMonitoringPalette.redActive
          : PumpMonitoringPalette.greenActive;
        const activeGlow = inRedZone
          ? PumpMonitoringPalette.redActiveGlow
          : PumpMonitoringPalette.greenActiveGlow;

        return (
          <Fragment key={index}>
            {index === PUMP_LED_ZONE_SEGMENT_COUNT ? (
              <div style={zoneDividerStyle} />
            ) : null}
            <div
              style={{
                ...ledSegmentBaseStyle,
                backgroundColor: active
                  ? activeColor
                  : PumpMonitoringPalette.segmentInactive,
                ...(active ? ledSegmentActiveStyle(activeGlow) : {}),
              }}
            />
          </Fragment>
        );
      })}
    </LedColumnShell>
  );
}

const zoneDividerStyle: CSSProperties = {
  width: "100%",
  height: LED_ZONE_DIVIDER_HEIGHT,
  borderRadius: 1,
  backgroundColor: PumpMonitoringPalette.borderMuted,
  marginTop: 1,
  marginBottom: 1,
};
