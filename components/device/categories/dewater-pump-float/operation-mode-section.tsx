"use client";

import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";

import { OperationMode, type OperationModeValue } from "./device-settings";
import { PumpMonitoringPalette } from "./constants";

interface OperationModeSectionProps {
  mode: OperationModeValue;
  onChange: (mode: OperationModeValue) => void;
  /** Read-only dashboard — the choices are inert. */
  locked?: boolean;
  /** The change is with the device; the selection holds until it answers. */
  pending?: boolean;
}

const OPTIONS: {
  value: OperationModeValue;
  label: string;
}[] = [
  { value: OperationMode.Normal, label: "Normal" },
  { value: OperationMode.Winter, label: "Winter" },
  { value: OperationMode.Flush, label: "Flush" },
];

/**
 * Which set of trigger levels the station is running on.
 *
 * The same shaft is worked differently at different times of year, and setting
 * six columns' worth of levels by hand each time is the effort this removes:
 * the device keeps a full set of twelve levels per mode, so a mode is selected
 * once and every column moves to the levels that mode was left holding.
 *
 * The levels themselves are still set on the gauges below, exactly as before —
 * what changes is that a level set here is stored against the selected mode
 * rather than being the station's only one.
 */
export function OperationModeSection({
  mode,
  onChange,
  locked = false,
  pending = false,
}: OperationModeSectionProps) {
  return (
    <Box
      sx={{
        mb: 2,
        bgcolor: PumpMonitoringPalette.panelBg,
        border: `1px solid ${PumpMonitoringPalette.border}`,
        borderRadius: "20px",
        px: 2,
        py: 1.75,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          sx={{
            color: PumpMonitoringPalette.text,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          Operation Mode
        </Typography>
        {pending && <CircularProgress size={14} />}
      </Box>
      <Typography
        sx={{
          color: PumpMonitoringPalette.textMuted,
          fontSize: 13,
          lineHeight: "20px",
        }}
      >
        Each mode keeps its own high and low level for every pump. Selecting one
        puts its levels back in service; levels set below are stored against the
        mode selected here.
      </Typography>

      <RadioGroup
        value={String(mode)}
        onChange={(event) => {
          const next = Number(event.target.value);
          onChange(next as OperationModeValue);
        }}
        sx={{
          mt: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 0.5, md: 3 },
        }}
      >
        {OPTIONS.map((option) => (
          <FormControlLabel
            key={option.value}
            value={String(option.value)}
            disabled={locked || pending}
            control={<Radio size="small" />}
            label={
              <Typography
                sx={{
                  color: PumpMonitoringPalette.text,
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: "20px",
                }}
              >
                {option.label}
              </Typography>
            }
            sx={{ m: 0, gap: 0.75 }}
          />
        ))}
      </RadioGroup>
    </Box>
  );
}
