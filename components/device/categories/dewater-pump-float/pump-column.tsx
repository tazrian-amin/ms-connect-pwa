"use client";

import type { CSSProperties } from "react";

import { PumpMonitoringPalette } from "./constants";
import { PumpLedColumnWithThreshold } from "./pump-led-column-with-threshold";
import { isPumpOn } from "./pump-led-threshold-logic";
import type { PumpStatus } from "./types";

interface PumpColumnProps {
  pump: PumpStatus;
  waterLevel: number;
  onResetRuntime: (pumpId: number) => void;
  onTriggerLevelHighChange: (pumpId: number, level: number) => void;
  onTriggerLevelLowChange: (pumpId: number, level: number) => void;
}

function StatusIndicator({
  label,
  active,
  activeColor,
}: {
  label: string;
  active: boolean;
  activeColor: string;
}) {
  return (
    <div style={indicatorRowStyle}>
      <span style={indicatorLabelStyle}>{label}</span>
      <span
        style={{
          ...indicatorDotStyle,
          backgroundColor: active
            ? activeColor
            : PumpMonitoringPalette.indicatorOff,
        }}
      />
    </div>
  );
}

export function PumpColumn({
  pump,
  waterLevel,
  onResetRuntime,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
}: PumpColumnProps) {
  const pumpIsOn = isPumpOn(
    waterLevel,
    pump.triggerLevelLow,
    pump.triggerLevelHigh,
  );

  return (
    <div style={columnStyle}>
      <p style={titleStyle}>Pump {pump.id}</p>

      <PumpLedColumnWithThreshold
        triggerLevelHigh={pump.triggerLevelHigh}
        triggerLevelLow={pump.triggerLevelLow}
        onTriggerLevelHighChange={(level) =>
          onTriggerLevelHighChange(pump.id, level)
        }
        onTriggerLevelLowChange={(level) =>
          onTriggerLevelLowChange(pump.id, level)
        }
      />

      <div style={indicatorsStyle}>
        <StatusIndicator
          label="ON"
          active={pumpIsOn}
          activeColor={PumpMonitoringPalette.greenActive}
        />
        <StatusIndicator
          label="OFF"
          active={!pumpIsOn}
          activeColor={PumpMonitoringPalette.redActive}
        />
      </div>

      <div style={runtimeCardStyle}>
        <span style={runtimeLabelStyle}>Runtime</span>
        <span style={runtimeValueStyle}>{pump.runtimeHours}h</span>
        <button
          type="button"
          className="transition-opacity active:opacity-75"
          style={resetButtonStyle}
          onClick={() => onResetRuntime(pump.id)}
          aria-label={`Reset runtime for pump ${pump.id}`}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

const columnStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  minWidth: 100,
};

const titleStyle: CSSProperties = {
  color: PumpMonitoringPalette.text,
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 12,
  textAlign: "center",
};

const indicatorsStyle: CSSProperties = {
  marginTop: 16,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const indicatorRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: PumpMonitoringPalette.columnBg,
  border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
  borderRadius: 12,
  paddingLeft: 12,
  paddingRight: 12,
  paddingTop: 10,
  paddingBottom: 10,
};

const indicatorLabelStyle: CSSProperties = {
  color: PumpMonitoringPalette.text,
  fontSize: 12,
  fontWeight: 500,
};

const indicatorDotStyle: CSSProperties = {
  display: "inline-block",
  width: 18,
  height: 18,
  borderRadius: 9,
};

const runtimeCardStyle: CSSProperties = {
  marginTop: 16,
  width: "100%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: PumpMonitoringPalette.columnBg,
  border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
  borderRadius: 14,
  padding: 12,
  alignItems: "center",
  gap: 8,
};

const runtimeLabelStyle: CSSProperties = {
  color: PumpMonitoringPalette.textMuted,
  fontSize: 12,
};

const runtimeValueStyle: CSSProperties = {
  color: PumpMonitoringPalette.text,
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: 0.5,
};

const resetButtonStyle: CSSProperties = {
  marginTop: 4,
  paddingLeft: 20,
  paddingRight: 20,
  paddingTop: 8,
  paddingBottom: 8,
  borderRadius: 10,
  backgroundColor: PumpMonitoringPalette.resetButtonBg,
  border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
  color: PumpMonitoringPalette.resetButtonText,
  fontSize: 14,
  fontWeight: 600,
};
