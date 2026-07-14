"use client";

import { useCallback, useState, type CSSProperties } from "react";
import Box from "@mui/material/Box";

import { COLUMN_GAP, DASHBOARD_MIN_WIDTH, PumpMonitoringPalette } from "./constants";
import { createDemoPumpMonitoringData } from "./demo-data";
import { PumpColumn } from "./pump-column";
import type { PumpMonitoringData } from "./types";
import { WaterLevelColumn } from "./water-level-column";

interface PumpMonitoringDashboardProps {
  data?: PumpMonitoringData;
}

export function PumpMonitoringDashboard({
  data: dataProp,
}: PumpMonitoringDashboardProps) {
  const [data, setData] = useState<PumpMonitoringData>(
    () => dataProp ?? createDemoPumpMonitoringData(),
  );
  const [prevDataProp, setPrevDataProp] = useState(dataProp);

  if (dataProp !== prevDataProp) {
    setPrevDataProp(dataProp);
    if (dataProp != null) {
      setData(dataProp);
    }
  }

  const resetRuntime = useCallback((pumpId: number) => {
    setData((prev) => ({
      ...prev,
      pumps: prev.pumps.map((p) =>
        p.id === pumpId ? { ...p, runtimeHours: 0 } : p,
      ),
    }));
  }, []);

  const setTriggerLevelHigh = useCallback((pumpId: number, level: number) => {
    setData((prev) => ({
      ...prev,
      pumps: prev.pumps.map((p) =>
        p.id === pumpId ? { ...p, triggerLevelHigh: level } : p,
      ),
    }));
  }, []);

  const setTriggerLevelLow = useCallback((pumpId: number, level: number) => {
    setData((prev) => ({
      ...prev,
      pumps: prev.pumps.map((p) =>
        p.id === pumpId ? { ...p, triggerLevelLow: level } : p,
      ),
    }));
  }, []);

  return (
    <div>
      <p style={subheadingStyle}>
        Monitor water level, control pump trigger levels, and track runtime.
      </p>

      <div style={panelStyle}>
        <Box sx={{ overflowX: { xs: "visible", md: "auto" } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              flexWrap: { xs: "wrap", md: "nowrap" },
              justifyContent: { xs: "center", md: "flex-start" },
              gap: `${COLUMN_GAP}px`,
              pb: 0.5,
              minWidth: { xs: 0, md: DASHBOARD_MIN_WIDTH },
            }}
          >
            <WaterLevelColumn waterLevel={data.waterLevel} />
            {data.pumps.map((pump) => (
              <PumpColumn
                key={pump.id}
                pump={pump}
                waterLevel={data.waterLevel}
                onResetRuntime={resetRuntime}
                onTriggerLevelHighChange={setTriggerLevelHigh}
                onTriggerLevelLowChange={setTriggerLevelLow}
              />
            ))}
          </Box>
        </Box>
      </div>
    </div>
  );
}

const subheadingStyle: CSSProperties = {
  color: PumpMonitoringPalette.textMuted,
  fontSize: 15,
  marginTop: 6,
  marginBottom: 16,
  lineHeight: "22px",
};

const panelStyle: CSSProperties = {
  backgroundColor: PumpMonitoringPalette.panelBg,
  border: `1px solid ${PumpMonitoringPalette.border}`,
  borderRadius: 20,
  padding: 16,
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
};

