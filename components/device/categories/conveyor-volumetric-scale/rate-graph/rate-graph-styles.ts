// Unselected buttons follow the ambient MUI theme; selected buttons get an
// explicit primary-color fill for the brand accent.
export const rateGraphToggleButtonSx = {
  textTransform: "none",
  "&.Mui-selected": {
    color: "primary.contrastText",
    bgcolor: "primary.main",
    "&:hover": { bgcolor: "primary.main" },
  },
} as const;
