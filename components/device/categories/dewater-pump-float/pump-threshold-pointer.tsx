"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  LED_COLUMN_WIDTH,
  PumpMonitoringPalette,
  THRESHOLD_POINTER_HEIGHT,
  THRESHOLD_POINTER_WIDTH,
} from "./constants";
import {
  zoneLevelToRelativeTop,
  zoneRelativeMaxTop,
  zoneRelativeTopToLevel,
} from "./zone-threshold-math";

export type ZonePointerLabel = "HIGH" | "LOW";

interface PumpThresholdPointerProps {
  label: ZonePointerLabel;
  /** 0 = bottom of zone, 100 = top of zone. */
  value: number;
  zoneTop: number;
  zoneBottom: number;
  onValueChange: (value: number) => void;
}

/**
 * Draggable threshold slider. Ported from a React Native version that used
 * react-native-gesture-handler + reanimated; here it's plain Pointer Events,
 * and (unlike the RN tap-vs-pan gesture split) a click always jumps the
 * thumb to the pointer position before tracking further movement.
 */
export function PumpThresholdPointer({
  label,
  value,
  zoneTop,
  zoneBottom,
  onValueChange,
}: PumpThresholdPointerProps) {
  const maxTop = zoneRelativeMaxTop(zoneTop, zoneBottom);
  const zoneHeight = zoneBottom - zoneTop;
  const hitAreaRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [thumbTop, setThumbTop] = useState(() =>
    zoneLevelToRelativeTop(value, zoneTop, zoneBottom),
  );

  useEffect(() => {
    if (!isDraggingRef.current) {
      setThumbTop(zoneLevelToRelativeTop(value, zoneTop, zoneBottom));
    }
  }, [value, zoneTop, zoneBottom]);

  const topFromPointer = useCallback(
    (clientY: number) => {
      const rect = hitAreaRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const relativeY = clientY - rect.top - THRESHOLD_POINTER_HEIGHT / 2;
      return Math.min(maxTop, Math.max(0, relativeY));
    },
    [maxTop],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    isDraggingRef.current = true;
    const next = topFromPointer(event.clientY);
    if (next !== null) setThumbTop(next);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const next = topFromPointer(event.clientY);
    if (next !== null) setThumbTop(next);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const finalTop = topFromPointer(event.clientY) ?? thumbTop;
    setThumbTop(finalTop);
    onValueChange(zoneRelativeTopToLevel(finalTop, zoneTop, zoneBottom));
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      ref={hitAreaRef}
      role="slider"
      aria-label={`Pump ${label.toLowerCase()} trigger level`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      style={{ ...zoneHitAreaStyle, top: zoneTop, height: zoneHeight }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div style={{ ...thumbStyle, top: thumbTop }}>
        <div style={thumbBarStyle}>
          <span style={thumbLabelStyle}>{label}</span>
        </div>
      </div>
    </div>
  );
}

const zoneHitAreaStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  width: LED_COLUMN_WIDTH,
  zIndex: 2,
  cursor: "ns-resize",
  touchAction: "none",
};

const thumbStyle: CSSProperties = {
  position: "absolute",
  left: (LED_COLUMN_WIDTH - THRESHOLD_POINTER_WIDTH) / 2,
  width: THRESHOLD_POINTER_WIDTH,
  height: THRESHOLD_POINTER_HEIGHT,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const thumbBarStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  height: THRESHOLD_POINTER_HEIGHT,
  borderRadius: 5,
  backgroundColor: PumpMonitoringPalette.thresholdPointer,
  border: `2px solid ${PumpMonitoringPalette.thresholdPointerBorder}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.2)",
};

const thumbLabelStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.6,
  color: PumpMonitoringPalette.thresholdPointerGrip,
};
