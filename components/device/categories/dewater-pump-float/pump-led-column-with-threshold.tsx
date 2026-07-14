"use client";

import type { CSSProperties } from "react";

import {
  LED_COLUMN_HEIGHT,
  LED_COLUMN_WIDTH,
  PUMP_GREEN_ZONE_BOTTOM,
  PUMP_GREEN_ZONE_TOP,
  PUMP_RED_ZONE_BOTTOM,
  PUMP_RED_ZONE_TOP,
  PumpMonitoringPalette,
} from "./constants";
import { PumpLevelLedColumn } from "./pump-level-led-column";
import { PumpThresholdPointer } from "./pump-threshold-pointer";

interface PumpLedColumnWithThresholdProps {
  triggerLevelHigh: number;
  triggerLevelLow: number;
  onTriggerLevelHighChange: (level: number) => void;
  onTriggerLevelLowChange: (level: number) => void;
}

export function PumpLedColumnWithThreshold({
  triggerLevelHigh,
  triggerLevelLow,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
}: PumpLedColumnWithThresholdProps) {
  return (
    <div style={wrapperStyle}>
      <div style={columnStackStyle}>
        <PumpLevelLedColumn
          triggerLevelLow={triggerLevelLow}
          triggerLevelHigh={triggerLevelHigh}
        />
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
      </div>
      <p style={levelHintStyle}>High {triggerLevelHigh}%</p>
      <p style={levelHintStyle}>Low {triggerLevelLow}%</p>
    </div>
  );
}

const wrapperStyle: CSSProperties = {
  width: LED_COLUMN_WIDTH,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const columnStackStyle: CSSProperties = {
  width: LED_COLUMN_WIDTH,
  height: LED_COLUMN_HEIGHT,
  position: "relative",
};

const levelHintStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 11,
  color: PumpMonitoringPalette.textMuted,
  fontWeight: 500,
  textAlign: "center",
};
