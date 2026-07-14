"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { CssBaseline, ThemeProvider, useMediaQuery } from "@mui/material";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { BluetoothProvider } from "@/context/bluetooth-provider";
import { getAppTheme } from "@/lib/mui/theme";

export function AppProviders({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(() => getAppTheme(prefersDark ? "dark" : "light"), [prefersDark]);

  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BluetoothProvider>{children}</BluetoothProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
