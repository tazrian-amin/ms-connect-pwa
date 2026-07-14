import { createTheme, type PaletteMode } from "@mui/material/styles";

// Mirrors the brand tokens in app/globals.css so MUI and the remaining
// Tailwind-styled surfaces read as one design language.
export function getAppTheme(mode: PaletteMode) {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#ffc500",
        contrastText: "#000000",
      },
      secondary: {
        main: isDark ? "#ffffff" : "#000000",
        contrastText: isDark ? "#000000" : "#ffffff",
      },
      background: {
        default: isDark ? "#09090b" : "#fafafa",
        paper: isDark ? "#18181b" : "#ffffff",
      },
      text: {
        primary: isDark ? "#fafafa" : "#18181b",
      },
    },
    typography: {
      fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
          },
        },
      },
    },
  });
}
