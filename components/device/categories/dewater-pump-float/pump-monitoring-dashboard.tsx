"use client";

import { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useBluetooth } from "@/context/bluetooth-provider";
import { retrofitFloatCommands } from "@/lib/bluetooth/commands";
import { COLUMN_GAP, DASHBOARD_MIN_WIDTH, PumpMonitoringPalette } from "./constants";
import { createDemoPumpMonitoringData } from "./demo-data";
import { PumpColumn } from "./pump-column";
import {
  triggerLevelHighToAdc,
  triggerLevelLowToAdc,
} from "./pump-threshold-adc";
import type { PumpMonitoringData } from "./types";
import { WaterLevelColumn } from "./water-level-column";

interface PumpMonitoringDashboardProps {
  data?: PumpMonitoringData;
}

export function PumpMonitoringDashboard({
  data: dataProp,
}: PumpMonitoringDashboardProps) {
  const { status, sendCommand } = useBluetooth();
  const isConnected = status === "connected";

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

  const sendThresholdCommand = useCallback(
    (command: Record<string, string>) => {
      if (isConnected) {
        void sendCommand(command);
      } else {
        console.debug(
          `[BLE] Not connected — threshold command not sent: ${JSON.stringify(command)}`,
        );
      }
    },
    [isConnected, sendCommand],
  );

  const setTriggerLevelHigh = useCallback(
    (pumpId: number, level: number) => {
      setData((prev) => ({
        ...prev,
        pumps: prev.pumps.map((p) =>
          p.id === pumpId ? { ...p, triggerLevelHigh: level } : p,
        ),
      }));
      sendThresholdCommand(
        retrofitFloatCommands.setPumpHighThreshold(
          pumpId,
          triggerLevelHighToAdc(level),
        ),
      );
    },
    [sendThresholdCommand],
  );

  const setTriggerLevelLow = useCallback(
    (pumpId: number, level: number) => {
      setData((prev) => ({
        ...prev,
        pumps: prev.pumps.map((p) =>
          p.id === pumpId ? { ...p, triggerLevelLow: level } : p,
        ),
      }));
      sendThresholdCommand(
        retrofitFloatCommands.setPumpLowThreshold(
          pumpId,
          triggerLevelLowToAdc(level),
        ),
      );
    },
    [sendThresholdCommand],
  );

  return (
    <Box>
      <Typography sx={{ color: PumpMonitoringPalette.textMuted, fontSize: 15, mt: 0.75, mb: 2, lineHeight: "22px" }}>
        Monitor water level, control pump trigger levels, and track runtime.
      </Typography>

      <Box
        sx={{
          bgcolor: PumpMonitoringPalette.panelBg,
          border: `1px solid ${PumpMonitoringPalette.border}`,
          borderRadius: "20px",
          p: 2,
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Box sx={{ overflowX: { xs: "visible", md: "auto" } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "center", md: "flex-start" },
              gap: `${COLUMN_GAP}px`,
              pb: 0.5,
              minWidth: { xs: 0, md: DASHBOARD_MIN_WIDTH },
            }}
          >
            <WaterLevelColumn waterLevel={data.waterLevel} />
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                flexWrap: { xs: "wrap", md: "nowrap" },
                justifyContent: "center",
                width: { xs: "100%", md: "auto" },
                gap: `${COLUMN_GAP}px`,
              }}
            >
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
        </Box>
      </Box>
    </Box>
  );
}
