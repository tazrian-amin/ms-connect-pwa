"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import ToggleButton from "@mui/material/ToggleButton";
import Typography from "@mui/material/Typography";

import type { DeviceReading, PumpRuntime } from "@/types/bluetooth";
import { useBluetooth } from "@/context/bluetooth-provider";
import { retrofitFloatCommands } from "@/lib/bluetooth/commands";
import {
  COLUMN_GAP,
  PUMP_COLUMN_WIDTH,
  PUMP_MIN_OFF_TIME_DEFAULT,
  PumpMonitoringPalette,
} from "./constants";
import { AlterationModeSection } from "./alteration-mode-section";
import { createDemoPumpMonitoringData, DEMO_COLUMN_PUMPS } from "./demo-data";
import {
  AlterationMode,
  readAlterationMode,
  readColumnPump,
  readColumnSettings,
  readPumpMinOffTime,
  readPumpSettings,
  readWaterBand,
  type AlterationModeValue,
} from "./device-settings";
import { MinOffTimeSection } from "./min-off-time-section";
import { isPumpOn } from "./pump-led-threshold-logic";
import { PumpColumn } from "./pump-column";
import { PumpHeaderRows, type PumpColumnView } from "./pump-header-rows";
import { derivePumpRunState } from "./pump-run-state";
import { ResetCounterDialog } from "./reset-counter-dialog";
import type {
  ColumnStatus,
  PumpMonitoringData,
  PumpStatus,
  SessionCounter,
} from "./types";
import { useDeviceCommand } from "./use-device-command";
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

/** Spinner key for one control on one pump — see useDeviceCommand. */
function pumpKey(pumpId: number, control: string): string {
  return `pump-${pumpId}-${control}`;
}

/** Same, for a control that belongs to the column rather than to a pump. */
function columnKey(columnNumber: number, control: string): string {
  return `column-${columnNumber}-${control}`;
}

// Minute-resolution elapsed-time label, e.g. "0d 0h 5m", "2d 4h 23m". All three
// units are always spelled out, empty or not, so a counter keeps the same shape
// as it grows and the figures line up down a column. Sub-minute runtime reads
// as "0d 0h 0m" — seconds are deliberately not shown.
function formatRuntime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
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
  const { status, sendCommand, readings, pumpRuntimes, resetPumpRuntime } =
    useBluetooth();
  const isConnected = status === "connected";

  // Every control on the dashboard writes straight to the device, so the
  // dashboard opens read-only and the user has to opt in before anything can
  // be changed by accident.
  const [editsEnabled, setEditsEnabled] = useState(false);

  // There is nothing to write to without a device, so edits can only be
  // unlocked while one is connected — and a drop re-locks the dashboard rather
  // than leaving every control open against no device.
  const editsUnlocked = editsEnabled && isConnected;

  const toggleEdits = useCallback(
    () => setEditsEnabled((prev) => !prev),
    [],
  );

  const [data, setData] = useState<PumpMonitoringData>(
    () => dataProp ?? createDemoPumpMonitoringData(),
  );
  const [prevDataProp, setPrevDataProp] = useState(dataProp);

  // Re-render once a second while any pump is running so its live runtime
  // counts up between the firmware's periodic pushes. Idle when nothing is on.
  const [nowMs, setNowMs] = useState(() => Date.now());
  // The firmware never reports a disabled pump as running, so its own state is
  // the whole test — nothing here re-derives it.
  const anyPumpOn =
    isConnected && data.pumps.some((p) => pumpRuntimes[p.id]?.isOn);
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

  // Nothing on this dashboard decides anything: the device owns every setting
  // below, and each handler only asks it to change one, then leaves the UI to
  // follow whatever comes back. The values themselves are read out of the
  // firmware's own reports (see `pumps`, `waterHigh`, `minOffTimeMinutes`), so
  // a command that is rejected or never answered simply leaves the dashboard
  // reading as the device still has it — and says so, via useDeviceCommand.
  //
  // Disconnected there is no device to own anything, so the demo state below
  // stands in and changes apply locally.
  const { isPending, run } = useDeviceCommand();

  // Only get_pump_states reports the thresholds and enable flags — the periodic
  // report carries neither — so without this the dashboard would open on demo
  // defaults that need not be what the device is actually running.
  useEffect(() => {
    if (!isConnected) return;
    void sendCommand(retrofitFloatCommands.getPumpStates());
  }, [isConnected, sendCommand]);

  // How the device is sharing the demand out. A control setting it owns, not a
  // view preference — on either alteration setting the columns become roles and
  // the firmware rotates which pump fills them.
  const [demoAlterationMode, setDemoAlterationMode] =
    useState<AlterationModeValue>(AlterationMode.Off);
  const alterationMode = isConnected
    ? readAlterationMode(readings) ?? AlterationMode.Off
    : demoAlterationMode;

  const setAlterationMode = useCallback(
    async (mode: AlterationModeValue) => {
      if (!isConnected) {
        setDemoAlterationMode(mode);
        return;
      }
      await run({
        key: "alteration-mode",
        command: retrofitFloatCommands.setAlterationMode(mode),
        confirms: "alteration_mode",
        action: "change the alteration mode",
      });
    },
    [isConnected, run],
  );

  // Device-reported pump state. Falls back to the demo values only until the
  // first report lands (and permanently while disconnected).
  const pumps = useMemo<PumpStatus[]>(() => {
    if (!isConnected) return data.pumps;
    return data.pumps.map((pump) => {
      const reported = readPumpSettings(readings, pump.id);
      return {
        ...pump,
        enabled: reported.enabled ?? pump.enabled,
        totalStarts: reported.totalStarts ?? pump.totalStarts,
        currentStarts: reported.currentStarts ?? pump.currentStarts,
        faulted: reported.faulted ?? pump.faulted,
      };
    });
  }, [isConnected, data.pumps, readings]);

  // The columns: their two levels, and which pump the device has put to each.
  // Both are the firmware's to decide — a column with no pump yet is the
  // alteration-mode T.B.D. case, which is why `pumpId` can be null.
  const columns = useMemo<ColumnStatus[]>(() => {
    return data.columns.map((column) => {
      if (!isConnected) {
        return {
          ...column,
          pumpId:
            demoAlterationMode === AlterationMode.Off
              ? column.number
              : DEMO_COLUMN_PUMPS.get(column.number) ?? null,
        };
      }
      const reported = readColumnSettings(readings, column.number);
      return {
        number: column.number,
        triggerLevelHigh: reported.triggerLevelHigh ?? column.triggerLevelHigh,
        triggerLevelLow: reported.triggerLevelLow ?? column.triggerLevelLow,
        pumpId: readColumnPump(readings, column.number),
      };
    });
  }, [isConnected, data.columns, demoAlterationMode, readings]);

  const pumpById = useMemo(
    () => new Map(pumps.map((pump) => [pump.id, pump])),
    [pumps],
  );

  // Disconnected stand-ins for the two device resets. Each clears its own
  // counter, exactly as the commands below do — the demo state is the only
  // thing the dashboard reads while there is no device to own the figures.
  const resetDemoRuntime = useCallback((pumpId: number) => {
    setData((prev) => ({
      ...prev,
      pumps: prev.pumps.map((p) =>
        p.id === pumpId ? { ...p, runtimeHours: 0 } : p,
      ),
    }));
  }, []);

  const resetDemoStarts = useCallback((pumpId: number) => {
    setData((prev) => ({
      ...prev,
      pumps: prev.pumps.map((p) =>
        p.id === pumpId ? { ...p, currentStarts: 0 } : p,
      ),
    }));
  }, []);

  // Reset is destructive and has no undo, so a Reset button only opens the
  // confirmation. Which pump, and which of its two session counters — they are
  // separate figures with a command each, so a card's button clears its own
  // and leaves the other running.
  const [pendingReset, setPendingReset] = useState<{
    pumpId: number;
    counter: SessionCounter;
  } | null>(null);
  const requestResetRuntime = useCallback(
    (pumpId: number) => setPendingReset({ pumpId, counter: "runtime" }),
    [],
  );
  const requestResetStarts = useCallback(
    (pumpId: number) => setPendingReset({ pumpId, counter: "starts" }),
    [],
  );
  const cancelReset = useCallback(() => setPendingReset(null), []);

  // The device owns the counter and answers with it, so the reply is what
  // zeroes the readout. Runtime alone has a local accumulator in the provider,
  // and it has to be cleared alongside, or it would keep counting from before
  // the reset; the start count is only ever the device's own report.
  const confirmReset = useCallback(async () => {
    if (pendingReset === null) return;
    const { pumpId, counter } = pendingReset;

    if (!isConnected) {
      if (counter === "runtime") resetDemoRuntime(pumpId);
      else resetDemoStarts(pumpId);
      setPendingReset(null);
      return;
    }

    if (counter === "runtime") {
      const reply = await run({
        key: pumpKey(pumpId, "reset-runtime"),
        command: retrofitFloatCommands.resetPumpRuntime(pumpId),
        // Confirmed on the command's own echo, not on the counter it zeroes:
        // the counter also rides every periodic report, so one arriving mid-flight
        // would read as an acknowledgement the device never sent.
        confirms: `pump_${pumpId}_reset_runtime`,
        action: `reset the session runtime for pump ${pumpId}`,
      });
      if (reply !== null) {
        resetPumpRuntime(pumpId);
      }
    } else {
      await run({
        key: pumpKey(pumpId, "reset-starts"),
        command: retrofitFloatCommands.resetPumpStarts(pumpId),
        confirms: `pump_${pumpId}_reset_starts`,
        action: `reset the session starts for pump ${pumpId}`,
      });
    }
    setPendingReset(null);
  }, [
    isConnected,
    pendingReset,
    resetDemoRuntime,
    resetDemoStarts,
    resetPumpRuntime,
    run,
  ]);

  // The firmware owns the consequence: it stops the pump on disable and keeps
  // it out of the control loop until re-enabled, so nothing else is sent here.
  // The switch stays where it is until the device confirms the new flag.
  const setPumpEnabled = useCallback(
    async (pumpId: number, enabled: boolean) => {
      if (!isConnected) {
        setData((prev) => ({
          ...prev,
          pumps: prev.pumps.map((p) =>
            p.id === pumpId ? { ...p, enabled } : p,
          ),
        }));
        return;
      }
      await run({
        key: pumpKey(pumpId, "enabled"),
        command: retrofitFloatCommands.setPumpEnabled(pumpId, enabled),
        confirms: `pump_${pumpId}_enabled`,
        action: `${enabled ? "enable" : "disable"} pump ${pumpId}`,
      });
    },
    [isConnected, run],
  );

  // Disconnected-only stand-in; connected, the device's value is the one shown.
  const [demoMinOffTimeMinutes, setDemoMinOffTimeMinutes] = useState(
    PUMP_MIN_OFF_TIME_DEFAULT,
  );
  const minOffTimeMinutes = isConnected
    ? readPumpMinOffTime(readings) ?? PUMP_MIN_OFF_TIME_DEFAULT
    : demoMinOffTimeMinutes;

  const applyMinOffTime = useCallback(
    async (minutes: number) => {
      if (!isConnected) {
        setDemoMinOffTimeMinutes(minutes);
        return true;
      }
      const reply = await run({
        key: "min-off-time",
        command: retrofitFloatCommands.setPumpMinOffTimeMin(minutes),
        confirms: "pump_min_off_time_min",
        action: "set the minimum off time",
      });
      return reply !== null;
    },
    [isConnected, run],
  );

  // Keyed by column: the levels belong to the role, and under alteration the
  // pump answering them is the device's to choose.
  const setTriggerLevelHigh = useCallback(
    async (columnNumber: number, level: number) => {
      if (!isConnected) {
        setData((prev) => ({
          ...prev,
          columns: prev.columns.map((c) =>
            c.number === columnNumber ? { ...c, triggerLevelHigh: level } : c,
          ),
        }));
        return;
      }
      await run({
        key: columnKey(columnNumber, "threshold"),
        command: retrofitFloatCommands.setColumnHighThreshold(
          columnNumber,
          level,
        ),
        confirms: `column_${columnNumber}_high_thr`,
        action: `set the high level for column ${columnNumber}`,
      });
    },
    [isConnected, run],
  );

  const setTriggerLevelLow = useCallback(
    async (columnNumber: number, level: number) => {
      if (!isConnected) {
        setData((prev) => ({
          ...prev,
          columns: prev.columns.map((c) =>
            c.number === columnNumber ? { ...c, triggerLevelLow: level } : c,
          ),
        }));
        return;
      }
      await run({
        key: columnKey(columnNumber, "threshold"),
        command: retrofitFloatCommands.setColumnLowThreshold(
          columnNumber,
          level,
        ),
        confirms: `column_${columnNumber}_low_thr`,
        action: `set the low level for column ${columnNumber}`,
      });
    },
    [isConnected, run],
  );

  // The water band is the device's too. The parent keeps a copy only because
  // the telemetry chart marks the same two levels, so the confirmed value is
  // pushed back up to it rather than being held in two places.
  const deviceWaterBand = readWaterBand(readings);
  const waterHigh = isConnected
    ? deviceWaterBand.high ?? waterTriggerLevelHigh
    : waterTriggerLevelHigh;
  const waterLow = isConnected
    ? deviceWaterBand.low ?? waterTriggerLevelLow
    : waterTriggerLevelLow;

  useEffect(() => {
    if (waterHigh !== waterTriggerLevelHigh) {
      onWaterTriggerLevelHighChange(waterHigh);
    }
  }, [waterHigh, waterTriggerLevelHigh, onWaterTriggerLevelHighChange]);

  useEffect(() => {
    if (waterLow !== waterTriggerLevelLow) {
      onWaterTriggerLevelLowChange(waterLow);
    }
  }, [waterLow, waterTriggerLevelLow, onWaterTriggerLevelLowChange]);

  const setWaterTriggerLevelHigh = useCallback(
    async (level: number) => {
      if (!isConnected) {
        onWaterTriggerLevelHighChange(level);
        return;
      }
      await run({
        key: "water-band",
        command: retrofitFloatCommands.setWaterHighThreshold(level),
        confirms: "water_high_thr",
        action: "set the water high level",
      });
    },
    [isConnected, onWaterTriggerLevelHighChange, run],
  );

  const setWaterTriggerLevelLow = useCallback(
    async (level: number) => {
      if (!isConnected) {
        onWaterTriggerLevelLowChange(level);
        return;
      }
      await run({
        key: "water-band",
        command: retrofitFloatCommands.setWaterLowThreshold(level),
        confirms: "water_low_thr",
        action: "set the water low level",
      });
    },
    [isConnected, onWaterTriggerLevelLowChange, run],
  );

  // Live device data takes over once connected, falling back to the demo
  // value only briefly (before the firmware's first periodic report
  // arrives). Disconnected always reads as 0 rather than showing stale/demo data.
  const liveWaterLevel = isConnected ? readCurrentWaterLevel(readings) : null;
  const waterLevel = isConnected ? liveWaterLevel ?? data.waterLevel : 0;

  // Device counters win once the firmware reports them; until then "current"
  // falls back to the locally derived session runtime, and "total" has no local
  // equivalent to stand in for. Disconnected shows the demo values. A column
  // with no pump bound has no counters at all — that is the T.B.D. case.
  const counterLabelsFor = (pump: PumpStatus | null) => {
    if (pump === null) {
      return {
        totalRuntime: UNAVAILABLE_LABEL,
        currentRuntime: UNAVAILABLE_LABEL,
        totalStarts: UNAVAILABLE_LABEL,
        currentStarts: UNAVAILABLE_LABEL,
      };
    }
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
      totalRuntime: isConnected
        ? totalSeconds === null
          ? UNAVAILABLE_LABEL
          : formatRuntime(totalSeconds)
        : formatRuntime(pump.totalRuntimeHours * 3600),
      currentRuntime: isConnected
        ? formatRuntime(currentSeconds ?? pumpRuntimeSeconds(runtime, nowMs))
        : formatRuntime(pump.runtimeHours * 3600),
      totalStarts: String(pump.totalStarts),
      currentStarts: String(pump.currentStarts),
    };
  };

  // What each column is, resolved once: which pump the device has put to it,
  // and what that pump is doing. The header rows and the gauge under them are
  // separate grid rows, so they would otherwise each work it out — and could
  // disagree about a pump mid-report.
  const columnViews: PumpColumnView[] = columns.map((column) => {
    const pump =
      column.pumpId === null ? null : pumpById.get(column.pumpId) ?? null;
    if (pump === null) return { column, pump, runState: null };

    // Connected, the firmware's own ON/OFF push is the whole answer;
    // disconnected there is nothing pushing, so the demo preview stands in.
    const isOn = isConnected
      ? pumpRuntimes[pump.id]?.isOn ?? false
      : isPumpOn(waterLevel, column.triggerLevelHigh);

    return {
      column,
      pump,
      runState: derivePumpRunState(pump.enabled, isOn, pump.faulted),
    };
  });

  const pendingResetPump =
    pendingReset === null
      ? undefined
      : pumps.find((p) => p.id === pendingReset.pumpId);

  // The figure the confirmation quotes back: whichever counter is being cleared.
  const pendingResetValueLabel = !pendingResetPump
    ? ""
    : pendingReset?.counter === "starts"
      ? counterLabelsFor(pendingResetPump).currentStarts
      : counterLabelsFor(pendingResetPump).currentRuntime;

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
            value="edits"
            size="small"
            selected={editsUnlocked}
            disabled={!isConnected}
            onChange={toggleEdits}
            sx={headerToggleSx}
          >
            {editsUnlocked ? (
              <LockOutlinedIcon sx={{ fontSize: 17 }} />
            ) : (
              <LockOpenOutlinedIcon sx={{ fontSize: 17 }} />
            )}
            {editsUnlocked ? "Disable Edits" : "Enable Edits"}
          </ToggleButton>
        </Box>
      </Box>

      <MinOffTimeSection
        minutes={minOffTimeMinutes}
        onApply={applyMinOffTime}
        locked={!editsUnlocked}
      />

      <AlterationModeSection
        mode={alterationMode}
        onChange={setAlterationMode}
        locked={!editsUnlocked}
        pending={isPending("alteration-mode")}
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
        {/* One grid, so the three header rows and the gauges under them share
            a single set of columns — a pump's switch, number and status sit
            over its own gauge because they are literally the same grid column.
            That is also why the whole thing scrolls as one: two containers
            would drift apart the moment either was scrolled. */}
        <Box sx={{ overflowX: "auto" }}>
          <Box
            sx={{
              display: "grid",
              // The first column carries the row labels and, under them, the
              // water level column. Sized to whichever is wider rather than to
              // a guess at the labels' width.
              gridTemplateColumns: `auto repeat(${columnViews.length}, ${PUMP_COLUMN_WIDTH}px)`,
              columnGap: `${COLUMN_GAP}px`,
              rowGap: 1.5,
              alignItems: "center",
              pb: 0.5,
              width: "max-content",
            }}
          >
            <PumpHeaderRows
              views={columnViews}
              onEnabledChange={setPumpEnabled}
              locked={!editsUnlocked}
              isEnablePending={(pumpId) =>
                isPending(pumpKey(pumpId, "enabled"))
              }
            />

            {/* The gauge row. Top-aligned rather than centered: the columns
                run to different heights, and it is their tops that have to
                line up. */}
            <Box sx={{ alignSelf: "start", justifySelf: "center", pt: 1 }}>
              <WaterLevelColumn
                waterLevel={waterLevel}
                triggerLevelHigh={waterHigh}
                triggerLevelLow={waterLow}
                onTriggerLevelHighChange={setWaterTriggerLevelHigh}
                onTriggerLevelLowChange={setWaterTriggerLevelLow}
                locked={!editsUnlocked}
                pending={isPending("water-band")}
              />
            </Box>

            {columnViews.map(({ column, pump }) => {
              const labels = counterLabelsFor(pump);

              return (
                <Box
                  key={column.number}
                  sx={{ alignSelf: "start", width: "100%", pt: 1 }}
                >
                  <PumpColumn
                    column={column}
                    pump={pump}
                    totalRuntimeLabel={labels.totalRuntime}
                    currentRuntimeLabel={labels.currentRuntime}
                    totalStartsLabel={labels.totalStarts}
                    currentStartsLabel={labels.currentStarts}
                    onResetRuntime={requestResetRuntime}
                    onResetStarts={requestResetStarts}
                    onTriggerLevelHighChange={setTriggerLevelHigh}
                    onTriggerLevelLowChange={setTriggerLevelLow}
                    locked={!editsUnlocked}
                    thresholdPending={isPending(
                      columnKey(column.number, "threshold"),
                    )}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      <ResetCounterDialog
        open={pendingResetPump !== undefined}
        pumpId={pendingResetPump?.id ?? null}
        counter={pendingReset?.counter ?? "runtime"}
        valueLabel={pendingResetValueLabel}
        onConfirm={confirmReset}
        onCancel={cancelReset}
        pending={
          pendingReset !== null &&
          isPending(pumpKey(pendingReset.pumpId, `reset-${pendingReset.counter}`))
        }
      />
    </Box>
  );
}
