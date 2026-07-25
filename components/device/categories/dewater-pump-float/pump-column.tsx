"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { PumpMonitoringPalette } from "./constants";
import { PumpLevelGauge } from "./pump-level-gauge";
import type { PumpStatus } from "./types";

interface PumpColumnProps {
  pump: PumpStatus;
  isOn: boolean;
  /** Preformatted total runtime, e.g. "1h 05m" or "12s". */
  runtimeLabel: string;
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
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: PumpMonitoringPalette.columnBg,
        border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
        borderRadius: "12px",
        px: 1.5,
        py: 1.25,
      }}
    >
      <Typography sx={{ color: PumpMonitoringPalette.text, fontSize: 12, fontWeight: 500 }}>
        {label}
      </Typography>
      <Box
        sx={{
          width: 18,
          height: 18,
          borderRadius: "9px",
          bgcolor: active ? activeColor : PumpMonitoringPalette.indicatorOff,
        }}
      />
    </Stack>
  );
}

export function PumpColumn({
  pump,
  isOn,
  runtimeLabel,
  onResetRuntime,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
}: PumpColumnProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100 }}>
      <Typography sx={{ color: PumpMonitoringPalette.text, fontSize: 16, fontWeight: 600, mb: 1.5 }}>
        Pump {pump.id}
      </Typography>

      <PumpLevelGauge
        triggerLevelHigh={pump.triggerLevelHigh}
        triggerLevelLow={pump.triggerLevelLow}
        onTriggerLevelHighChange={(level) => onTriggerLevelHighChange(pump.id, level)}
        onTriggerLevelLowChange={(level) => onTriggerLevelLowChange(pump.id, level)}
      />

      <Stack spacing={1} sx={{ mt: 2, width: "100%" }}>
        <StatusIndicator label="ON" active={isOn} activeColor={PumpMonitoringPalette.greenActive} />
        <StatusIndicator label="OFF" active={!isOn} activeColor={PumpMonitoringPalette.redActive} />
      </Stack>

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
        }}
      >
        <Typography sx={{ color: PumpMonitoringPalette.textMuted, fontSize: 12 }}>Runtime</Typography>
        <Typography sx={{ color: PumpMonitoringPalette.text, fontSize: 20, fontWeight: 700, letterSpacing: 0.5 }}>
          {runtimeLabel}
        </Typography>
        <Button
          size="small"
          onClick={() => onResetRuntime(pump.id)}
          aria-label={`Reset runtime for pump ${pump.id}`}
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
