"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import {
  PUMP_DISABLED_OPACITY,
  PUMP_TOGGLE_HEIGHT,
  PumpMonitoringPalette,
  STATUS_INDICATOR_HEIGHT,
} from "./constants";
import { PumpAssignmentRadios } from "./pump-assignment-radios";
import { PumpLevelGauge } from "./pump-level-gauge";
import type { PumpStatus } from "./types";

/** This column's slice of the alteration matrix — see PumpAssignmentRadios. */
interface PumpColumnMatrix {
  rowIds: number[];
  selectedRowId: number | null;
  onSelect: (pumpId: number, rowId: number) => void;
}

interface PumpColumnProps {
  pump: PumpStatus;
  isOn: boolean;
  /**
   * Preformatted lifetime runtime since installation, e.g. "2d 4h 23m".
   * Not resettable.
   */
  totalRuntimeLabel: string;
  /** Preformatted runtime since the last reset, same format. */
  currentRuntimeLabel: string;
  onResetRuntime: (pumpId: number) => void;
  onEnabledChange: (pumpId: number, enabled: boolean) => void;
  onTriggerLevelHighChange: (pumpId: number, level: number) => void;
  onTriggerLevelLowChange: (pumpId: number, level: number) => void;
  /**
   * Read-only column: every control is inert, but the readouts, gauge and
   * status all keep reading as normal.
   */
  locked?: boolean;
  /**
   * Alteration mode: the column's title gives way to its radio stack, since
   * the matrix's row labels already name the pumps down the left-hand side.
   * Absent outside alteration mode, where the title comes back.
   */
  matrix?: PumpColumnMatrix;
}

/**
 * Single pill carrying the pump's binary state — dot color plus its label.
 * A disabled pump is always off, and shows a neutral dot rather than the
 * red "off, but still in the control loop" one.
 */
function StatusIndicator({
  isOn,
  disabled,
}: {
  isOn: boolean;
  disabled: boolean;
}) {
  const color = disabled
    ? PumpMonitoringPalette.indicatorOff
    : isOn
      ? PumpMonitoringPalette.greenActive
      : PumpMonitoringPalette.redActive;
  const glow = disabled
    ? "transparent"
    : isOn
      ? PumpMonitoringPalette.greenActiveGlow
      : PumpMonitoringPalette.redActiveGlow;

  return (
    <Stack
      direction="row"
      spacing={1}
      role="status"
      sx={{
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: STATUS_INDICATOR_HEIGHT,
        bgcolor: PumpMonitoringPalette.columnBg,
        border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
        borderRadius: "12px",
        px: 1.5,
      }}
    >
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: "6px",
          bgcolor: color,
          boxShadow: `0 0 0 3px ${glow}`,
        }}
      />
      <Typography
        sx={{
          color: disabled
            ? PumpMonitoringPalette.textMuted
            : PumpMonitoringPalette.text,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {isOn ? "ON" : "OFF"}
      </Typography>
    </Stack>
  );
}

/** One labelled runtime figure inside the runtime card. */
function RuntimeRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Typography
        sx={{
          color: PumpMonitoringPalette.textMuted,
          fontSize: 11,
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: PumpMonitoringPalette.text,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 0.3,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function PumpColumn({
  pump,
  isOn,
  totalRuntimeLabel,
  currentRuntimeLabel,
  onResetRuntime,
  onEnabledChange,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
  locked = false,
  matrix,
}: PumpColumnProps) {
  const disabled = !pump.enabled;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 100,
      }}
    >
      {/* The one control that stays live while the rest of the column is
          switched out — kept at full contrast so it reads as the way back. */}
      <Box
        sx={{
          height: PUMP_TOGGLE_HEIGHT,
          mb: 1.5,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Switch
          size="small"
          checked={pump.enabled}
          disabled={locked}
          onChange={(event) => onEnabledChange(pump.id, event.target.checked)}
          slotProps={{ input: { "aria-label": `Enable pump ${pump.id}` } }}
        />
      </Box>

      {matrix ? (
        <Box sx={{ mb: 1.5 }}>
          <PumpAssignmentRadios
            pumpId={pump.id}
            rowIds={matrix.rowIds}
            selectedRowId={matrix.selectedRowId}
            onSelect={matrix.onSelect}
            disabled={disabled}
            locked={locked}
          />
        </Box>
      ) : (
        <Typography
          sx={{
            color: disabled
              ? PumpMonitoringPalette.textMuted
              : PumpMonitoringPalette.text,
            fontSize: 16,
            fontWeight: 600,
            mb: 1.5,
          }}
        >
          Pump {pump.id}
        </Typography>
      )}

      <Box sx={{ mb: 1.5 }}>
        <StatusIndicator isOn={isOn} disabled={disabled} />
      </Box>

      <PumpLevelGauge
        triggerLevelHigh={pump.triggerLevelHigh}
        triggerLevelLow={pump.triggerLevelLow}
        onTriggerLevelHighChange={(level) =>
          onTriggerLevelHighChange(pump.id, level)
        }
        onTriggerLevelLowChange={(level) =>
          onTriggerLevelLowChange(pump.id, level)
        }
        disabled={disabled}
        locked={locked}
      />

      <Stack
        spacing={1}
        sx={{
          alignItems: "center",
          mt: 2,
          width: "100%",
          bgcolor: PumpMonitoringPalette.columnBg,
          border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
          borderRadius: "14px",
          p: 1.5,
          ...(disabled ? { opacity: PUMP_DISABLED_OPACITY } : {}),
        }}
      >
        <RuntimeRow label="Total runtime" value={totalRuntimeLabel} />
        <Box
          sx={{
            width: "100%",
            height: "1px",
            bgcolor: PumpMonitoringPalette.borderMuted,
          }}
        />
        <RuntimeRow label="Session runtime" value={currentRuntimeLabel} />
        <Button
          size="small"
          disabled={disabled || locked}
          onClick={() => onResetRuntime(pump.id)}
          aria-label={`Reset current runtime for pump ${pump.id}`}
          sx={{
            mt: 0.5,
            px: 2.5,
            borderRadius: "10px",
            bgcolor: PumpMonitoringPalette.resetButtonBg,
            border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
            color: PumpMonitoringPalette.resetButtonText,
            fontSize: 14,
            fontWeight: 600,
            textTransform: "none",
            "&:hover": { bgcolor: PumpMonitoringPalette.resetButtonBg },
          }}
        >
          Reset
        </Button>
      </Stack>
    </Box>
  );
}
