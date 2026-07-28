"use client";

import {
  useCallback,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import {
  LED_COLUMN_HEIGHT,
  LED_COLUMN_WIDTH,
  PumpMonitoringPalette,
  THRESHOLD_MARKER_HEIGHT,
  THRESHOLD_POINTER_HEIGHT,
  THRESHOLD_POINTER_WIDTH,
} from "./constants";
import {
  resolveThresholdLayout,
  trackOffsetToLevel,
  type ThresholdPointerLayout,
} from "./threshold-track-math";

export type ThresholdPointerLabel = "HIGH" | "LOW";

interface ThresholdTrackProps {
  /** Subject of the sliders, e.g. "Pump" — used for the accessible names. */
  name: string;
  /** 0–100 over the full column; never drops below `low`. */
  triggerLevelHigh: number;
  /** 0–100 over the full column; never rises above `high`. */
  triggerLevelLow: number;
  onTriggerLevelHighChange: (value: number) => void;
  onTriggerLevelLowChange: (value: number) => void;
  /** Pointers still mark the band, but can't be dragged. */
  disabled?: boolean;
}

interface DragState {
  label: ThresholdPointerLabel;
  level: number;
}

/**
 * Whichever pointer is nearer the press wins. When they sit together, the
 * direction of the press decides — so a stacked pair can still be pulled
 * apart (press above the meeting point to take HIGH, below it to take LOW).
 */
function pointerUnderPress(
  level: number,
  triggerLevelHigh: number,
  triggerLevelLow: number,
): ThresholdPointerLabel {
  const highDistance = Math.abs(level - triggerLevelHigh);
  const lowDistance = Math.abs(level - triggerLevelLow);
  if (highDistance === lowDistance) {
    return level >= triggerLevelHigh ? "HIGH" : "LOW";
  }
  return highDistance < lowDistance ? "HIGH" : "LOW";
}

function ThresholdPointer({
  name,
  label,
  layout,
  value,
  valueMin,
  valueMax,
  disabled,
}: {
  name: string;
  label: ThresholdPointerLabel;
  layout: ThresholdPointerLayout;
  value: number;
  valueMin: number;
  valueMax: number;
  disabled: boolean;
}) {
  return (
    <Box
      role="slider"
      aria-label={`${name} ${label.toLowerCase()} trigger level`}
      aria-valuemin={valueMin}
      aria-valuemax={valueMax}
      aria-valuenow={value}
      aria-disabled={disabled || undefined}
      sx={{ pointerEvents: "none" }}
    >
      <Box
        sx={{
          position: "absolute",
          top: layout.markerTop,
          left: 0,
          width: LED_COLUMN_WIDTH,
          height: THRESHOLD_MARKER_HEIGHT,
          borderRadius: "1px",
          bgcolor: PumpMonitoringPalette.thresholdPointerBorder,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: layout.pillTop,
          left: (LED_COLUMN_WIDTH - THRESHOLD_POINTER_WIDTH) / 2,
          width: THRESHOLD_POINTER_WIDTH,
          height: THRESHOLD_POINTER_HEIGHT,
          borderRadius: "5px",
          bgcolor: PumpMonitoringPalette.thresholdPointer,
          border: `2px solid ${PumpMonitoringPalette.thresholdPointerBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.2)",
        }}
      >
        <Typography
          sx={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.6,
            color: PumpMonitoringPalette.thresholdPointerGrip,
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * A column's HIGH/LOW threshold sliders, overlaid on an LED column by the
 * pump gauge and the water level column alike. Both share one hit area
 * spanning the whole column — each pointer can travel the full height, and
 * the pair is clamped so they may meet but never cross. A press always jumps
 * the nearer pointer to it before tracking movement; the change is only
 * reported on release, so a drag sends a single command.
 */
export function ThresholdTrack({
  name,
  triggerLevelHigh,
  triggerLevelLow,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
  disabled = false,
}: ThresholdTrackProps) {
  const [drag, setDrag] = useState<DragState | null>(null);

  // HIGH cannot be dragged below LOW, and LOW cannot be dragged above HIGH.
  const clampToSibling = useCallback(
    (label: ThresholdPointerLabel, level: number) =>
      label === "HIGH"
        ? Math.max(level, triggerLevelLow)
        : Math.min(level, triggerLevelHigh),
    [triggerLevelHigh, triggerLevelLow],
  );

  const levelFromPointer = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): number => {
    const rect = event.currentTarget.getBoundingClientRect();
    return trackOffsetToLevel(event.clientY - rect.top);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    const level = levelFromPointer(event);
    const label = pointerUnderPress(level, triggerLevelHigh, triggerLevelLow);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ label, level: clampToSibling(label, level) });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    setDrag({
      label: drag.label,
      level: clampToSibling(drag.label, levelFromPointer(event)),
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const level = clampToSibling(drag.label, levelFromPointer(event));
    setDrag(null);
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (drag.label === "HIGH") {
      if (level !== triggerLevelHigh) onTriggerLevelHighChange(level);
    } else if (level !== triggerLevelLow) {
      onTriggerLevelLowChange(level);
    }
  };

  const handlePointerCancel = () => setDrag(null);

  const highLevel = drag?.label === "HIGH" ? drag.level : triggerLevelHigh;
  const lowLevel = drag?.label === "LOW" ? drag.level : triggerLevelLow;
  const layout = resolveThresholdLayout(highLevel, lowLevel);

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      sx={{
        position: "absolute",
        left: 0,
        top: 0,
        width: LED_COLUMN_WIDTH,
        height: LED_COLUMN_HEIGHT,
        zIndex: 2,
        cursor: disabled ? "default" : "ns-resize",
        touchAction: "none",
        ...(disabled ? { pointerEvents: "none" } : {}),
      }}
    >
      {/* LOW first so HIGH stacks above it where the two overlap. */}
      <ThresholdPointer
        name={name}
        label="LOW"
        layout={layout.low}
        value={lowLevel}
        valueMin={0}
        valueMax={highLevel}
        disabled={disabled}
      />
      <ThresholdPointer
        name={name}
        label="HIGH"
        layout={layout.high}
        value={highLevel}
        valueMin={lowLevel}
        valueMax={100}
        disabled={disabled}
      />
    </Box>
  );
}
