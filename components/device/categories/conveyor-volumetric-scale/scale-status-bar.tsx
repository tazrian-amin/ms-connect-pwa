import type { CSSProperties } from "react";
import { SCALE_STATUS_LABELS, ScalePalette } from "./constants";
import type { ScaleOperationalState } from "./types";

const SEGMENT_COUNT = 4;

function getSegmentColors(state: ScaleOperationalState): string[] {
  const inactive = ScalePalette.segmentInactive;
  const light = ScalePalette.segmentLight;

  switch (state) {
    case "stopped-belt":
      return Array.from({ length: SEGMENT_COUNT }, () => inactive);
    case "black-belt":
      return [light, inactive, inactive, inactive];
    case "below-range":
      return [ScalePalette.stateOrange, ScalePalette.stateOrange, inactive, inactive];
    case "optimum-range":
      return [ScalePalette.stateGreen, ScalePalette.stateGreen, ScalePalette.stateGreen, inactive];
    case "above-range":
      return Array.from({ length: SEGMENT_COUNT }, () => ScalePalette.stateRed);
    default:
      return [];
  }
}

interface ScaleStatusBarProps {
  state: ScaleOperationalState;
}

export function ScaleStatusBar({ state }: ScaleStatusBarProps) {
  if (state === "offline") {
    return (
      <div style={offlineBoxStyle}>
        <span style={offlineTextStyle}>{SCALE_STATUS_LABELS.offline}</span>
      </div>
    );
  }

  const segmentColors = getSegmentColors(state);

  return (
    <div style={barStyle}>
      {segmentColors.map((color, index) => (
        <div
          key={index}
          style={{
            ...segmentStyle,
            backgroundColor: color,
            ...(index === 0 ? { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 } : {}),
            ...(index === SEGMENT_COUNT - 1 ? { borderTopRightRadius: 8, borderBottomRightRadius: 8 } : {}),
          }}
        />
      ))}
    </div>
  );
}

const barStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  height: 24,
  borderRadius: 12,
  overflow: "hidden",
  gap: 3,
  backgroundColor: ScalePalette.segmentInactive,
  padding: 2,
  width: "100%",
};

const segmentStyle: CSSProperties = {
  flex: 1,
  borderRadius: 2,
};

const offlineBoxStyle: CSSProperties = {
  height: 48,
  width: "100%",
  border: `1px solid ${ScalePalette.border}`,
  borderRadius: 4,
  backgroundColor: ScalePalette.panelBg,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const offlineTextStyle: CSSProperties = {
  color: ScalePalette.text,
  fontSize: 18,
  fontWeight: 700,
  letterSpacing: 1,
};
