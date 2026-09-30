"use client";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Typography from "@mui/material/Typography";

import { ScalePalette } from "./constants";

export type ScaleMode = "normal" | "calibration";

export const DEFAULT_SCALE_MODE: ScaleMode = "normal";

const OPTIONS: { value: ScaleMode; label: string; description: string }[] = [
  { value: "normal", label: "Normal", description: "Measures the material on the belt." },
  {
    value: "calibration",
    label: "Calibration",
    description: "The belt runs empty so the scale can learn its baseline.",
  },
];

interface ScaleModeSectionProps {
  mode: ScaleMode;
  onChange: (mode: ScaleMode) => void;
  /** Read-only dashboard — the choices are inert. */
  locked?: boolean;
  /** The change is with the device; the selection holds until it lands. */
  pending?: boolean;
}

/**
 * Whether the scale is measuring production or calibrating. Calibration tells
 * the device the belt is running empty, so whatever it sees is taken as the
 * zero point — the belt has to actually be clear for that to hold.
 */
export function ScaleModeSection({ mode, onChange, locked = false, pending = false }: ScaleModeSectionProps) {
  return (
    <Box
      sx={{
        mb: 2,
        bgcolor: ScalePalette.panelBg,
        border: `1px solid ${ScalePalette.border}`,
        borderRadius: "20px",
        px: 2,
        py: 1.75,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ color: ScalePalette.text, fontSize: 16, fontWeight: 600 }}>Scale Mode</Typography>
        {pending && <CircularProgress size={14} />}
      </Box>
      <Typography sx={{ color: ScalePalette.textMuted, fontSize: 13, lineHeight: "20px" }}>
        Choose Calibration only when the belt is running with no material on it. Switch back to Normal once
        calibration is done.
      </Typography>

      <RadioGroup
        value={mode}
        onChange={(event) => onChange(event.target.value as ScaleMode)}
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
            value={option.value}
            disabled={locked || pending}
            control={<Radio size="small" />}
            label={
              <Box>
                <Typography sx={{ color: ScalePalette.text, fontSize: 14, fontWeight: 600, lineHeight: "20px" }}>
                  {option.label}
                </Typography>
                <Typography sx={{ color: ScalePalette.textMuted, fontSize: 12, lineHeight: "18px" }}>
                  {option.description}
                </Typography>
              </Box>
            }
            sx={{ m: 0, gap: 0.75, alignItems: "flex-start", "& .MuiRadio-root": { pt: 0.25 } }}
          />
        ))}
      </RadioGroup>
    </Box>
  );
}
