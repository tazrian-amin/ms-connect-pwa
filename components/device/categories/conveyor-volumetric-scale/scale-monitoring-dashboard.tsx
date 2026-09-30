"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ToggleButton from "@mui/material/ToggleButton";
import { TelemetryChart } from "@/components/device/telemetry-chart";
import { useBluetooth } from "@/context/bluetooth-provider";
import { volumetricCommands } from "@/lib/bluetooth/commands";
import { createDemoScaleMonitoringData } from "./demo-data";
import { DEFAULT_CONVEYOR_SETTINGS, type ConveyorSettings } from "./conveyor-settings";
import { ConveyorSettingsSection, type ConveyorSettingsChange } from "./conveyor-settings-section";
import { DEFAULT_SCALE_MODE, ScaleModeSection, type ScaleMode } from "./scale-mode-section";
import { ScalePalette } from "./constants";
import type { ScaleMonitoringData } from "./types";
import { ScaleSection } from "./scale-section";
import { pickScaleLimits } from "./scale-settings";
import { DEFAULT_UNITS, formatQuantity, toDisplay, type MeasurementUnits } from "./units";

interface ScaleMonitoringDashboardProps {
  data?: ScaleMonitoringData;
}

export function ScaleMonitoringDashboard({ data: dataProp }: ScaleMonitoringDashboardProps) {
  const [data, setData] = useState<ScaleMonitoringData>(() => dataProp ?? createDemoScaleMonitoringData());
  const [prevDataProp, setPrevDataProp] = useState(dataProp);
  const { status, sendCommand, productionRateSamples } = useBluetooth();
  const isConnected = status === "connected";

  // The scale mode and settings sections write straight to the device, so the
  // dashboard opens read-only and the user has to opt in before anything can be
  // changed by accident. A dropped connection re-locks it.
  const [editsEnabled, setEditsEnabled] = useState(false);
  const editsUnlocked = editsEnabled && isConnected;
  const toggleEdits = useCallback(() => setEditsEnabled((prev) => !prev), []);

  const [conveyorSettings, setConveyorSettings] = useState<ConveyorSettings>(DEFAULT_CONVEYOR_SETTINGS);
  // The one place the dashboard's units are decided; every conveyor input is
  // shown and entered in these.
  const [units, setUnits] = useState<MeasurementUnits>(DEFAULT_UNITS);

  const applyConveyorSettings = useCallback(
    async ({ conveyor, limits, units: nextUnits }: ConveyorSettingsChange) => {
      // TODO: debugging only — remove once the firmware side is wired up.
      console.log("[scale settings] input:", { conveyor, limits, units: nextUnits });
      const appliedUnits = nextUnits ?? units;

      // Material and belt speed go to the device, in the selected units. The
      // volumetric firmware doesn't read them back yet, so a landed write is
      // the only confirmation there is; a failed one surfaces through the
      // provider's own error state.
      if (conveyor != null && conveyor.density != null && conveyor.beltSpeed != null) {
        const command = volumetricCommands.setConveyorSettings({
          materialType: conveyor.materialType,
          density: Number(formatQuantity(toDisplay(conveyor.density, "density", appliedUnits))),
          densityUnit: appliedUnits.density,
          beltSpeed: Number(formatQuantity(toDisplay(conveyor.beltSpeed, "speed", appliedUnits))),
          beltSpeedUnit: appliedUnits.speed,
        });
        console.log("[scale settings] command:", command);
        await sendCommand(command);
        setConveyorSettings(conveyor);
      }

      // No device command exists for the belt limits yet, so they only
      // update the page.
      if (limits != null) {
        setData((prev) => ({ ...prev, scale: { ...prev.scale, ...limits } }));
      }
      if (nextUnits != null) {
        setUnits(nextUnits);
      }
      return true;
    },
    [sendCommand, units],
  );

  const [scaleMode, setScaleMode] = useState<ScaleMode>(DEFAULT_SCALE_MODE);
  const [scaleModePending, setScaleModePending] = useState(false);

  const changeScaleMode = useCallback(
    async (mode: ScaleMode) => {
      const command = volumetricCommands.setScaleMode(mode);
      // TODO: debugging only — remove once the firmware side is wired up.
      console.log("[scale mode] input:", mode);
      console.log("[scale mode] command:", command);
      setScaleModePending(true);
      try {
        await sendCommand(command);
        setScaleMode(mode);
      } finally {
        setScaleModePending(false);
      }
    },
    [sendCommand],
  );

  if (dataProp !== prevDataProp) {
    setPrevDataProp(dataProp);
    if (dataProp != null) {
      setData(dataProp);
    }
  }

  // Memoized: the section discards its draft whenever this changes identity.
  const scaleLimits = useMemo(() => pickScaleLimits(data.scale), [data.scale]);

  return (
    <div style={rootStyle}>
      <div style={headerRowStyle}>
        <p style={subheadingStyle}>
          Current readings from the scale reporting to this device. Values update once per minute for a near real-time
          view of production.
        </p>

        <ToggleButton
          value="edits"
          size="small"
          selected={editsUnlocked}
          disabled={!isConnected}
          onChange={toggleEdits}
          sx={headerToggleSx}
        >
          {editsUnlocked ? <LockOutlinedIcon sx={{ fontSize: 17 }} /> : <LockOpenOutlinedIcon sx={{ fontSize: 17 }} />}
          {editsUnlocked ? "Disable Edits" : "Enable Edits"}
        </ToggleButton>
      </div>

      <ScaleModeSection
        mode={scaleMode}
        onChange={changeScaleMode}
        locked={!editsUnlocked}
        pending={scaleModePending}
      />

      <ConveyorSettingsSection
        settings={conveyorSettings}
        limits={scaleLimits}
        units={units}
        onApply={applyConveyorSettings}
        locked={!editsUnlocked}
      />

      <div style={panelStyle}>
        <ScaleSection scale={data.scale} shiftNumber={data.shiftNumber} />
      </div>

      <div style={telemetryStyle}>
        <TelemetryChart
          samples={productionRateSamples}
          title="Production Rate Telemetry"
          seriesLabel="Production Rate (ton/hr)"
          emptyMessage="Waiting for production rate readings from the device..."
          showAverage={false}
        />
      </div>
    </div>
  );
}

const rootStyle: CSSProperties = { display: "flex", flexDirection: "column" };

const headerRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 16,
};

const subheadingStyle: CSSProperties = { color: ScalePalette.textMuted, fontSize: 15, lineHeight: "22px", margin: 0 };

const headerToggleSx: SxProps<Theme> = {
  gap: 0.75,
  px: 1.5,
  py: 0.75,
  flexShrink: 0,
  borderRadius: "10px",
  borderColor: ScalePalette.borderMuted,
  color: ScalePalette.textMuted,
  fontSize: 13,
  fontWeight: 600,
  textTransform: "none",
  whiteSpace: "nowrap",
  lineHeight: 1.2,
  "&.Mui-selected": {
    color: ScalePalette.text,
    borderColor: ScalePalette.greenActive,
    bgcolor: ScalePalette.editUnlockedBg,
    "&:hover": { bgcolor: ScalePalette.editUnlockedBg },
  },
  "&.Mui-disabled": {
    borderColor: ScalePalette.borderMuted,
    color: ScalePalette.textMuted,
    opacity: 0.45,
  },
};

const panelStyle: CSSProperties = {
  backgroundColor: ScalePalette.panelBg,
  border: `1px solid ${ScalePalette.border}`,
  borderRadius: 20,
  padding: 16,
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
};

const telemetryStyle: CSSProperties = { marginTop: 16 };
