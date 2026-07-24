"use client";

import { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import type { DeviceReading } from "@/types/bluetooth";
import { useBluetooth } from "@/context/bluetooth-provider";
import { retrofitFloatCommands } from "@/lib/bluetooth/commands";
import { COLUMN_GAP, DASHBOARD_MIN_WIDTH, PumpMonitoringPalette } from "./constants";
import { createDemoPumpMonitoringData } from "./demo-data";
import { isPumpOn } from "./pump-led-threshold-logic";
import { PumpColumn } from "./pump-column";
import type { PumpMonitoringData } from "./types";
import { WaterLevelColumn } from "./water-level-column";

interface PumpMonitoringDashboardProps {
  data?: PumpMonitoringData;
}

// The firmware pushes these as plain JSON keys (see bluetooth-provider's
// generic reading fan-out) rather than as a dedicated context field.
function readCurrentWaterLevel(readings: DeviceReading[]): number | null {
  const value = readings.find((r) => r.id === "current_water_level")?.value;
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// Defaults to OFF until the firmware reports this pump's state — it only
// pushes pump_N_state on a hysteresis transition, never on connect — see
// firmware README "Pump ON/OFF control").
function readLivePumpIsOn(readings: DeviceReading[], pumpId: number): boolean {
  const value = readings.find((r) => r.id === `pump_${pumpId}_state`)?.value;
  return value === "on";
}

export function PumpMonitoringDashboard({
  data: dataProp,
}: PumpMonitoringDashboardProps) {
  const { status, sendCommand, readings } = useBluetooth();
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
        retrofitFloatCommands.setPumpHighThreshold(pumpId, level),
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
        retrofitFloatCommands.setPumpLowThreshold(pumpId, level),
      );
    },
    [sendThresholdCommand],
  );

  // Live device data takes over once connected, falling back to the demo
  // value only briefly (before the firmware's first periodic report
  // arrives). Disconnected always reads as 0 rather than showing stale/demo data.
  const liveWaterLevel = isConnected ? readCurrentWaterLevel(readings) : null;
  const waterLevel = isConnected ? liveWaterLevel ?? data.waterLevel : 0;

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
            <WaterLevelColumn waterLevel={waterLevel} />
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
              {data.pumps.map((pump) => {
                // Live device state takes over once connected — the firmware
                // now owns the hysteresis decision. Reads as OFF until the
                // first pump_N_state push this session (see firmware README).
                const isOn = isConnected
                  ? readLivePumpIsOn(readings, pump.id)
                  : isPumpOn(waterLevel, pump.triggerLevelHigh);

                return (
                  <PumpColumn
                    key={pump.id}
                    pump={pump}
                    isOn={isOn}
                    onResetRuntime={resetRuntime}
                    onTriggerLevelHighChange={setTriggerLevelHigh}
                    onTriggerLevelLowChange={setTriggerLevelLow}
                  />
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
