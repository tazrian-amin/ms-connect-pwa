"use client";

import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";

import { AlterationMode, type AlterationModeValue } from "./device-settings";
import { PumpMonitoringPalette } from "./constants";

interface AlterationModeSectionProps {
  mode: AlterationModeValue;
  onChange: (mode: AlterationModeValue) => void;
  /** Read-only dashboard — the choices are inert. */
  locked?: boolean;
  /** The change is with the device; the selection holds until it answers. */
  pending?: boolean;
}

const OPTIONS: {
  value: AlterationModeValue;
  label: string;
}[] = [
  { value: AlterationMode.Off, label: "No Alteration" },
  { value: AlterationMode.Starts, label: "Based on Starts" },
  { value: AlterationMode.Runtime, label: "Based on Run Time" },
];

/**
 * How the device shares demand across the enabled pumps, to extend the life of
 * all of them rather than wearing out whichever one happens to lead.
 *
 * A device setting, not a view preference: on either alteration setting the
 * columns become roles and the firmware rotates which pump fills them, so the
 * choice changes what the pumps actually do.
 */
export function AlterationModeSection({
  mode,
  onChange,
  locked = false,
  pending = false,
}: AlterationModeSectionProps) {
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
          Alteration Mode
        </Typography>
        {pending && <CircularProgress size={14} />}
      </Box>

      <RadioGroup
        value={String(mode)}
        onChange={(event) => {
          const next = Number(event.target.value);
          onChange(next as AlterationModeValue);
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
