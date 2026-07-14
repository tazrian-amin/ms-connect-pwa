"use client";

import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { RateGraphPreset } from "./types";
import { RATE_GRAPH_PRESETS } from "./rate-graph-utils";
import { rateGraphToggleButtonSx } from "./rate-graph-styles";

interface RateGraphToolbarProps {
  activePreset: RateGraphPreset;
  onPresetChange: (preset: RateGraphPreset) => void;
}

export function RateGraphToolbar({ activePreset, onPresetChange }: RateGraphToolbarProps) {
  return (
    <Box sx={{ mb: 2, overflowX: "auto" }}>
      <ToggleButtonGroup
        value={activePreset}
        exclusive
        onChange={(_event, next: RateGraphPreset | null) => {
          if (next) onPresetChange(next);
        }}
        size="small"
      >
        {RATE_GRAPH_PRESETS.map((preset) => (
          <ToggleButton key={preset.id} value={preset.id} sx={rateGraphToggleButtonSx}>
            {preset.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
