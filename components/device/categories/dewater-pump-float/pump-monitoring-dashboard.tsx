"use client";

import { useCallback, useEffect, useState } from "react";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";

import type { DeviceReading, PumpRuntime } from "@/types/bluetooth";
import { useBluetooth } from "@/context/bluetooth-provider";
import { retrofitFloatCommands } from "@/lib/bluetooth/commands";
import {
  COLUMN_GAP,
  DASHBOARD_MIN_WIDTH,
  PUMP_MIN_OFF_TIME_DEFAULT,
  PumpMonitoringPalette,
} from "./constants";
import { createDemoPumpMonitoringData } from "./demo-data";
import { MinOffTimeSection } from "./min-off-time-section";
import { isPumpOn } from "./pump-led-threshold-logic";
import { PumpColumn } from "./pump-column";
import { ResetRuntimeDialog } from "./reset-runtime-dialog";
import type { PumpMonitoringData, PumpStatus } from "./types";
import { WaterLevelColumn } from "./water-level-column";

interface PumpMonitoringDashboardProps {
  data?: PumpMonitoringData;
  /**
   * The water column's own trigger band. Owned by the parent because the
   * telemetry chart marks the same two levels.
   */
  waterTriggerLevelHigh: number;
  waterTriggerLevelLow: number;
  onWaterTriggerLevelHighChange: (level: number) => void;
  onWaterTriggerLevelLowChange: (level: number) => void;
}

// The firmware pushes these as plain JSON keys (see bluetooth-provider's
// generic reading fan-out) rather than as a dedicated context field.
function readCurrentWaterLevel(readings: DeviceReading[]): number | null {
  const value = readings.find((r) => r.id === "current_water_level")?.value;
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// Session runtime = completed intervals + the current one if the pump is still
// on. `nowMs` drives the live count-up between firmware pushes.
function pumpRuntimeSeconds(
  runtime: PumpRuntime | undefined,
  nowMs: number,
): number {
  if (!runtime) return 0;
  const liveSeconds =
    runtime.isOn && runtime.onSinceEpoch !== null
      ? Math.max(0, nowMs / 1000 - runtime.onSinceEpoch)
      : 0;
  return runtime.accumulatedSeconds + liveSeconds;
}

// A device counter counts up live between reports, but only for the ON time the
// last report didn't already cover — hence the later of "pump turned on" and
// "counter was reported" as the start of the uncounted stretch.
function deviceCounterSeconds(
  runtime: PumpRuntime | undefined,
  reported: number | undefined,
  nowMs: number,
): number | null {
  if (!runtime || reported === undefined) return null;
  if (!runtime.isOn || runtime.onSinceEpoch === null) return reported;
  const countedThrough = Math.max(
    runtime.onSinceEpoch,
    runtime.countersReportedAtEpoch ?? runtime.onSinceEpoch,
  );
  return reported + Math.max(0, nowMs / 1000 - countedThrough);
}

// A disabled pump is off, but the firmware's OFF transition may not have
// landed yet — hold the counters instead of letting them run past the "OFF"
// the column already shows.
function holdRuntime(
  runtime: PumpRuntime | undefined,
  enabled: boolean,
): PumpRuntime | undefined {
  if (enabled || !runtime?.isOn) return runtime;
  return { ...runtime, isOn: false };
}

/** Shown for a device counter the firmware hasn't reported yet. */
const UNAVAILABLE_LABEL = "—";

// The ack for the min-off-time command, which is an UPCOMING FIRMWARE FEATURE
// whose reply shape isn't pinned down yet — so take either the value echoed
// back or a generic status line. Neither appears in the periodic water-level
// and pump-state reports, so this can't match one of those by accident.
function isMinOffTimeAck(json: Record<string, unknown>): boolean {
  return (
    json.pump_min_off_time_min !== undefined || typeof json.status === "string"
  );
}

// Minute-resolution elapsed-time label, e.g. "23m", "4h 23m", "2d 4h 23m".
// Sub-minute runtime reads as "0m" — seconds are deliberately not shown.
function formatRuntime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// The two header toggles read as one control pair, so their chrome lives here
// rather than being spelled out twice.
const headerToggleSx: SxProps<Theme> = {
  gap: 0.75,
  px: 1.5,
  py: 0.75,
  flexShrink: 0,
  borderRadius: "10px",
  borderColor: PumpMonitoringPalette.borderMuted,
  color: PumpMonitoringPalette.textMuted,
  fontSize: 13,
  fontWeight: 600,
  textTransform: "none",
  whiteSpace: "nowrap",
  lineHeight: 1.2,
  "&.Mui-selected": {
    color: PumpMonitoringPalette.text,
    borderColor: PumpMonitoringPalette.greenActive,
    bgcolor: PumpMonitoringPalette.editUnlockedBg,
    "&:hover": { bgcolor: PumpMonitoringPalette.editUnlockedBg },
  },
  "&.Mui-disabled": {
    borderColor: PumpMonitoringPalette.borderMuted,
    color: PumpMonitoringPalette.textMuted,
    opacity: 0.45,
  },
};

export function PumpMonitoringDashboard({
  data: dataProp,
  waterTriggerLevelHigh,
  waterTriggerLevelLow,
  onWaterTriggerLevelHighChange,
  onWaterTriggerLevelLowChange,
}: PumpMonitoringDashboardProps) {
  const {
    status,
    sendCommand,
    sendCommandAndWait,
    readings,
    pumpRuntimes,
    resetPumpRuntime,
  } = useBluetooth();
  const isConnected = status === "connected";

  // Every control on the dashboard writes straight to the device, so the
  // dashboard opens read-only and the user has to opt in before anything can
  // be changed by accident.
  const [editsEnabled, setEditsEnabled] = useState(false);

  // Alteration is a further opt-in layered on top of edits, so it can only be
  // armed while edits are unlocked.
  const [alterationEnabled, setAlterationEnabled] = useState(false);

  // Re-locking edits drops alteration with it — otherwise it would sit armed
  // and invisible behind a disabled toggle, ready the next time edits open.
  const toggleEdits = useCallback(() => {
    const next = !editsEnabled;
    setEditsEnabled(next);
    if (!next) setAlterationEnabled(false);
  }, [editsEnabled]);

  const [data, setData] = useState<PumpMonitoringData>(
    () => dataProp ?? createDemoPumpMonitoringData(),
  );
  const [prevDataProp, setPrevDataProp] = useState(dataProp);

  // Re-render once a second while any pump is running so its live runtime
  // counts up between the firmware's periodic pushes. Idle when nothing is on.
  const [nowMs, setNowMs] = useState(() => Date.now());
  const anyPumpOn =
    isConnected &&
    data.pumps.some((p) => p.enabled && pumpRuntimes[p.id]?.isOn);
  useEffect(() => {
    if (!anyPumpOn) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [anyPumpOn]);

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

  // Reset is destructive and has no undo, so the button only opens the
  // confirmation — `pendingResetPumpId` is the pump awaiting confirmation.
  const [pendingResetPumpId, setPendingResetPumpId] = useState<number | null>(
    null,
  );
  const requestResetRuntime = useCallback(
    (pumpId: number) => setPendingResetPumpId(pumpId),
    [],
  );
  const cancelResetRuntime = useCallback(() => setPendingResetPumpId(null), []);

  // Connected: reset the live accumulator tracked by the provider.
  // Disconnected: reset the local demo value instead.
  const confirmResetRuntime = useCallback(() => {
    if (pendingResetPumpId === null) return;
    if (isConnected) {
      resetPumpRuntime(pendingResetPumpId);
    } else {
      resetRuntime(pendingResetPumpId);
    }
    setPendingResetPumpId(null);
  }, [isConnected, pendingResetPumpId, resetPumpRuntime, resetRuntime]);

  const sendPumpCommand = useCallback(
    (command: Record<string, string>) => {
      if (isConnected) {
        void sendCommand(command);
      } else {
        console.debug(
          `[BLE] Not connected — pump command not sent: ${JSON.stringify(command)}`,
        );
      }
    },
    [isConnected, sendCommand],
  );

  // The firmware owns the consequence: it stops the pump on disable and keeps
  // it out of the control loop until re-enabled, so nothing else is sent here.
  const setPumpEnabled = useCallback(
    (pumpId: number, enabled: boolean) => {
      setData((prev) => ({
        ...prev,
        pumps: prev.pumps.map((p) => (p.id === pumpId ? { ...p, enabled } : p)),
      }));
      sendPumpCommand(retrofitFloatCommands.setPumpEnabled(pumpId, enabled));
    },
    [sendPumpCommand],
  );

  // Held in the UI only — nothing hydrates it on connect, so it reads as the
  // default again after a reconnect regardless of what the device has stored.
  const [minOffTimeMinutes, setMinOffTimeMinutes] = useState(
    PUMP_MIN_OFF_TIME_DEFAULT,
  );

  // Only the device's own confirmation commits the value locally, so the
  // dashboard never shows a setting the pumps aren't actually running under.
  // Disconnected there is nothing to confirm: the change is local anyway, so
  // it takes effect immediately rather than sitting out the reply timeout.
  const applyMinOffTime = useCallback(
    async (minutes: number) => {
      if (!isConnected) {
        setMinOffTimeMinutes(minutes);
        console.debug(
          `[BLE] Not connected — min off time applied locally only: ${minutes}m`,
        );
        return true;
      }

      const reply = await sendCommandAndWait(
        retrofitFloatCommands.setPumpMinOffTimeMin(minutes),
        isMinOffTimeAck,
      );
      if (!reply || reply.status === "error") return false;

      setMinOffTimeMinutes(minutes);
      return true;
    },
    [isConnected, sendCommandAndWait],
  );

  const setTriggerLevelHigh = useCallback(
    (pumpId: number, level: number) => {
      setData((prev) => ({
        ...prev,
        pumps: prev.pumps.map((p) =>
          p.id === pumpId ? { ...p, triggerLevelHigh: level } : p,
        ),
      }));
      sendPumpCommand(
        retrofitFloatCommands.setPumpHighThreshold(pumpId, level),
      );
    },
    [sendPumpCommand],
  );

  const setTriggerLevelLow = useCallback(
    (pumpId: number, level: number) => {
      setData((prev) => ({
        ...prev,
        pumps: prev.pumps.map((p) =>
          p.id === pumpId ? { ...p, triggerLevelLow: level } : p,
        ),
      }));
      sendPumpCommand(
        retrofitFloatCommands.setPumpLowThreshold(pumpId, level),
      );
    },
    [sendPumpCommand],
  );

  // Live device data takes over once connected, falling back to the demo
  // value only briefly (before the firmware's first periodic report
  // arrives). Disconnected always reads as 0 rather than showing stale/demo data.
  const liveWaterLevel = isConnected ? readCurrentWaterLevel(readings) : null;
  const waterLevel = isConnected ? liveWaterLevel ?? data.waterLevel : 0;

  // Device counters win once the firmware reports them; until then "current"
  // falls back to the locally derived session runtime, and "total" has no local
  // equivalent to stand in for. Disconnected shows the demo values.
  const runtimeLabelsFor = (pump: PumpStatus) => {
    const runtime = holdRuntime(pumpRuntimes[pump.id], pump.enabled);
    const totalSeconds = deviceCounterSeconds(
      runtime,
      runtime?.totalSeconds,
      nowMs,
    );
    const currentSeconds = deviceCounterSeconds(
      runtime,
      runtime?.currentSeconds,
      nowMs,
    );
    return {
      total: isConnected
        ? totalSeconds === null
          ? UNAVAILABLE_LABEL
          : formatRuntime(totalSeconds)
        : `${pump.totalRuntimeHours}h`,
      current: isConnected
        ? formatRuntime(currentSeconds ?? pumpRuntimeSeconds(runtime, nowMs))
        : `${pump.runtimeHours}h`,
    };
  };

  const pendingResetPump =
    pendingResetPumpId === null
      ? undefined
      : data.pumps.find((p) => p.id === pendingResetPumpId);

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          mt: 0.75,
          mb: 2,
        }}
      >
        <Typography sx={{ color: PumpMonitoringPalette.textMuted, fontSize: 15, lineHeight: "22px" }}>
          Monitor water level, control pump trigger levels, and track runtime.
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <ToggleButton
            value="alteration"
            size="small"
            selected={alterationEnabled}
            disabled={!editsEnabled}
            onChange={() => setAlterationEnabled((prev) => !prev)}
            sx={headerToggleSx}
          >
            <TuneOutlinedIcon sx={{ fontSize: 17 }} />
            {alterationEnabled ? "Disable Alteration" : "Enable Alteration"}
          </ToggleButton>

          <ToggleButton
            value="edits"
            size="small"
            selected={editsEnabled}
            onChange={toggleEdits}
            sx={headerToggleSx}
          >
            {/* Both the icon and the label name what the press will do, not the
                state it's in — the green tint already carries the state. */}
            {editsEnabled ? (
              <LockOutlinedIcon sx={{ fontSize: 17 }} />
            ) : (
              <LockOpenOutlinedIcon sx={{ fontSize: 17 }} />
            )}
            {editsEnabled ? "Disable Edits" : "Enable Edits"}
          </ToggleButton>
        </Box>
      </Box>

      <MinOffTimeSection
        minutes={minOffTimeMinutes}
        onApply={applyMinOffTime}
        locked={!editsEnabled}
      />

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
            <WaterLevelColumn
              waterLevel={waterLevel}
              triggerLevelHigh={waterTriggerLevelHigh}
              triggerLevelLow={waterTriggerLevelLow}
              onTriggerLevelHighChange={onWaterTriggerLevelHighChange}
              onTriggerLevelLowChange={onWaterTriggerLevelLowChange}
              locked={!editsEnabled}
            />
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
                // now owns the hysteresis decision. Reads as OFF (0s runtime)
                // until the first pump_N_state push this session (firmware only
                // pushes on a transition — see README "Pump ON/OFF control").
                // A disabled pump reads OFF regardless: the disable command
                // stops it, so don't show ON while that round trip completes.
                const runtime = pumpRuntimes[pump.id];
                const isOn =
                  pump.enabled &&
                  (isConnected
                    ? runtime?.isOn ?? false
                    : isPumpOn(waterLevel, pump.triggerLevelHigh));
                const runtimeLabels = runtimeLabelsFor(pump);

                return (
                  <PumpColumn
                    key={pump.id}
                    pump={pump}
                    isOn={isOn}
                    totalRuntimeLabel={runtimeLabels.total}
                    currentRuntimeLabel={runtimeLabels.current}
                    onResetRuntime={requestResetRuntime}
                    onEnabledChange={setPumpEnabled}
                    onTriggerLevelHighChange={setTriggerLevelHigh}
                    onTriggerLevelLowChange={setTriggerLevelLow}
                    locked={!editsEnabled}
                  />
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>

      <ResetRuntimeDialog
        open={pendingResetPump !== undefined}
        pumpId={pendingResetPump?.id ?? null}
        currentRuntimeLabel={
          pendingResetPump ? runtimeLabelsFor(pendingResetPump).current : ""
        }
        onConfirm={confirmResetRuntime}
        onCancel={cancelResetRuntime}
      />
    </Box>
  );
}
