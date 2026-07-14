"use client";

import { useMemo, type CSSProperties } from "react";

import {
  LedColumnShell,
  ledSegmentActiveStyle,
  ledSegmentBaseStyle,
} from "./led-column-shell";
import { PumpMonitoringPalette } from "./constants";

type SegmentColor = "water" | "green" | "red";

interface LedSegmentColumnProps {
  segmentCount: number;
  activeCount: number;
  color: SegmentColor;
  style?: CSSProperties;
}

function segmentColor(active: boolean, color: SegmentColor) {
  if (!active) return PumpMonitoringPalette.segmentInactive;
  switch (color) {
    case "water":
      return PumpMonitoringPalette.waterActive;
    case "green":
      return PumpMonitoringPalette.greenActive;
    case "red":
      return PumpMonitoringPalette.redActive;
  }
}

function segmentGlow(active: boolean, color: SegmentColor) {
  if (!active) return undefined;
  switch (color) {
    case "water":
      return PumpMonitoringPalette.waterActiveGlow;
    case "green":
      return PumpMonitoringPalette.greenActiveGlow;
    case "red":
      return PumpMonitoringPalette.redActiveGlow;
  }
}

/** Segments render bottom-to-top; index 0 is the lowest LED. */
export function LedSegmentColumn({
  segmentCount,
  activeCount,
  color,
  style,
}: LedSegmentColumnProps) {
  const segments = useMemo(
    () => Array.from({ length: segmentCount }, (_, i) => i),
    [segmentCount],
  );

  return (
    <LedColumnShell style={style}>
      {segments.map((index) => {
        const active = index < activeCount;
        return (
          <div
            key={index}
            style={{
              ...ledSegmentBaseStyle,
              backgroundColor: segmentColor(active, color),
              ...(active ? ledSegmentActiveStyle(segmentGlow(active, color)) : {}),
            }}
          />
        );
      })}
    </LedColumnShell>
  );
}
