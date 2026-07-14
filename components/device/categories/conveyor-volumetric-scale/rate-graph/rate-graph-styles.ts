// Shared ToggleButton styling for the rate graph's preset/time-mode
// selectors. Left un-selected buttons follow the ambient MUI theme (so they
// stay legible in both light and dark mode) while selected buttons get an
// explicit primary-color fill, matching the app's brand accent.
export const rateGraphToggleButtonSx = {
  textTransform: "none",
  "&.Mui-selected": {
    color: "primary.contrastText",
    bgcolor: "primary.main",
    "&:hover": { bgcolor: "primary.main" },
  },
} as const;
