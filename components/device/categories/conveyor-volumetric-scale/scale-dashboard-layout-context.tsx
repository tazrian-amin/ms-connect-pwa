"use client";

import {
  getDashboardLayout,
  getMinDashboardContentWidth,
  type ScaleDashboardLayout,
} from "./dashboard-layout";
import React, { createContext, useContext, useMemo } from "react";

const ScaleDashboardLayoutContext = createContext<ScaleDashboardLayout | null>(
  null,
);

type ScaleDashboardLayoutProviderProps = {
  availableWidth: number;
  children: React.ReactNode;
};

export function ScaleDashboardLayoutProvider({
  availableWidth,
  children,
}: ScaleDashboardLayoutProviderProps) {
  const layout = useMemo(
    () => getDashboardLayout(availableWidth),
    [availableWidth],
  );

  return (
    <ScaleDashboardLayoutContext.Provider value={layout}>
      {children}
    </ScaleDashboardLayoutContext.Provider>
  );
}

export function useScaleDashboardLayout(): ScaleDashboardLayout {
  const layout = useContext(ScaleDashboardLayoutContext);
  if (layout == null) {
    return getDashboardLayout(getMinDashboardContentWidth());
  }
  return layout;
}
