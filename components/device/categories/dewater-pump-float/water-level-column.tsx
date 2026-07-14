"use client";

import type { CSSProperties } from "react";

import { LedSegmentColumn } from "./led-segment-column";
import { PumpMonitoringPalette, WATER_LED_SEGMENT_COUNT } from "./constants";

interface WaterLevelColumnProps {
  waterLevel: number;
}

export function WaterLevelColumn({ waterLevel }: WaterLevelColumnProps) {
  const clamped = Math.min(100, Math.max(0, waterLevel));
  const activeCount = Math.round((clamped / 100) * WATER_LED_SEGMENT_COUNT);

  return (
    <div style={columnStyle}>
      <p style={titleStyle}>Water Level</p>
      <LedSegmentColumn
        segmentCount={WATER_LED_SEGMENT_COUNT}
        activeCount={activeCount}
        color="water"
      />
      <div style={levelBadgeStyle}>
        <span style={levelTextStyle}>{clamped}%</span>
      </div>
    </div>
  );
}

const columnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minWidth: 88,
};

const titleStyle: CSSProperties = {
  color: PumpMonitoringPalette.text,
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 16,
  textAlign: "center",
};

const levelBadgeStyle: CSSProperties = {
  marginTop: 16,
  backgroundColor: PumpMonitoringPalette.columnBg,
  border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
  borderRadius: 12,
  paddingLeft: 16,
  paddingRight: 16,
  paddingTop: 8,
  paddingBottom: 8,
};

const levelTextStyle: CSSProperties = {
  color: PumpMonitoringPalette.waterBadgeText,
  fontSize: 16,
  fontWeight: 600,
};
