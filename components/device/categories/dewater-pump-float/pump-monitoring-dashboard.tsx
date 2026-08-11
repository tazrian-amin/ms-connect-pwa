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
import { useToast } from "@/context/toast-provider";
import { retrofitFloatCommands } from "@/lib/bluetooth/commands";
import {
  COLUMN_GAP,
  CURRENT_COLUMN_WIDTH,
  PUMP_COLUMN_WIDTH,
  PUMP_GROUP_GAP,
  PUMP_MIN_OFF_TIME_DEFAULT,
  PumpMonitoringPalette,
} from "./constants";
import { AlterationModeSection } from "./alteration-mode-section";
import {
  createDemoModeColumnLevels,
  createDemoPumpMonitoringData,
  DEMO_COLUMN_PUMPS,
} from "./demo-data";
import {
  AlterationMode,
  OperationMode,
  readAlterationMode,
  readColumnPump,
  readColumnSettings,
  readCurrentBand,
  readMotorCurrent,
  readOperationMode,
  readPumpMinOffTime,
  readPumpSettings,
  readWaterBand,
  type AlterationModeValue,
  type OperationModeValue,
} from "./device-settings";
import { MinOffTimeSection } from "./min-off-time-section";
import {
  MotorCurrentColumn,
  MotorCurrentHeading,
} from "./motor-current-column";
import { OperationModeSection } from "./operation-mode-section";
import { isPumpOn } from "./pump-led-threshold-logic";
import { PumpColumn } from "./pump-column";
import { PumpCounterRows } from "./pump-counter-rows";
import {
  PumpGroupGutter,
  PumpHeaderRows,
  type PumpColumnView,
} from "./pump-header-rows";
import { derivePumpRunState } from "./pump-run-state";
import { ResetCounterDialog } from "./reset-counter-dialog";
import type {
  ColumnStatus,
  PumpMonitoringData,
  PumpStatus,
  SessionCounter,
} from "./types";
import { useDeviceCommand } from "./use-device-command";
import { useLastReset } from "./use-last-reset";
import { WaterLevelColumn } from "./water-level-column";

interface PumpMonitoringDashboardProps {
  data?: PumpMonitoringData;
  /**
   * The water column's own trigger band, in feet. Owned by the parent because
   * the telemetry chart marks the same two levels.
   */
  waterTriggerLevelHigh: number;
  waterTriggerLevelLow: number;
  onWaterTriggerLevelHighChange: (level: number) => void;
  onWaterTriggerLevelLowChange: (level: number) => void;
  /** The motor current column's alarm band, in amps — same arrangement, and
   * marked on the current chart for the same reason. */
  motorCurrentHigh: number;
  motorCurrentLow: number;
  onMotorCurrentHighChange: (level: number) => void;
  onMotorCurrentLowChange: (level: number) => void;
}

// The firmware pushes these as plain JSON keys (see bluetooth-provider's
// generic reading fan-out) rather than as a dedicated context field. The value
// is a depth in feet on the same 0–60 scale the columns draw, so it is used as
// reported — see the firmware's computeCurrentWaterLevelFeet.
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

/** Days rolled into a year, ignoring leap years — see `formatRuntime`. */
const DAYS_PER_YEAR = 365;

// Minute-resolution elapsed-time label, e.g. "0d 0h 5m", "2d 4h 23m". All three
// units are always spelled out, empty or not, so a counter keeps the same shape
// as it grows and the figures line up down a column. Sub-minute runtime reads
// as "0d 0h 0m" — seconds are deliberately not shown.
//
// A pump left in service for years would otherwise reach "731d 4h 23m", a figure
// nobody reads as two years without doing the division. Past a year the label
// rolls the days up and drops the minutes instead of adding a fourth unit —
// "2y 1d 4h" — because a counter that far along is read for its years, and the
// minute on a figure of that size is noise the column width can't afford.
function formatRuntime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days >= DAYS_PER_YEAR) {
    const years = Math.floor(days / DAYS_PER_YEAR);
    return `${years}y ${days % DAYS_PER_YEAR}d ${hours}h`;
  }
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
  motorCurrentHigh,
  motorCurrentLow,
  onMotorCurrentHighChange,
  onMotorCurrentLowChange,
}: PumpMonitoringDashboardProps) {
  const {
    status,
    sendCommand,
    readings,
    pumpRuntimes,
    resetPumpRuntime,
    deviceSerialNumber,
  } = useBluetooth();
  const { showToast } = useToast();
  const isConnected = status === "connected";

  // Filed against the controller's own serial, so switching stations doesn't
  // carry one's reset dates over to the next. Null until it reports one.
  const { lastReset, markReset } = useLastReset(deviceSerialNumber || null);

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

  // Which of the device's three threshold sets is in service. The levels
  // themselves are still the columns' own — this only decides which stored set
  // they are read from and written to, and the device swaps all twelve at once
  // when it changes.
  const [demoOperationMode, setDemoOperationMode] =
    useState<OperationModeValue>(OperationMode.Normal);
  const operationMode = isConnected
    ? readOperationMode(readings) ?? OperationMode.Normal
    : demoOperationMode;

  // Stands in for the device's per-mode threshold sets while disconnected, so
  // switching modes moves the columns with no hardware to store them. Connected
  // this is untouched: the device holds every set and reports the selected
  // one's levels as the columns' own.
  const [demoModeLevels, setDemoModeLevels] = useState(
    createDemoModeColumnLevels,
  );

  // The device answers with the twelve thresholds the new mode brings into
  // service, so nothing is queried afterwards — the columns follow the same
  // `column_N_high_thr` reports they always read.
  const setOperationMode = useCallback(
    async (mode: OperationModeValue) => {
      if (!isConnected) {
        setDemoOperationMode(mode);
        return;
      }
      await run({
        key: "operation-mode",
        command: retrofitFloatCommands.setOperationMode(mode),
        confirms: "operation_mode",
        action: "change the operation mode",
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
    return data.columns.map((column, columnIndex) => {
      if (!isConnected) {
        // The selected mode's stored levels are the column's levels, exactly
        // as they are on the device.
        const levels = demoModeLevels[demoOperationMode][columnIndex];
        return {
          ...column,
          triggerLevelHigh: levels?.high ?? column.triggerLevelHigh,
          triggerLevelLow: levels?.low ?? column.triggerLevelLow,
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
  }, [
    isConnected,
    data.columns,
    demoAlterationMode,
    demoModeLevels,
    demoOperationMode,
    readings,
  ]);

  const pumpById = useMemo(
    () => new Map(pumps.map((pump) => [pump.id, pump])),
    [pumps],
  );

  // Disconnected stand-ins for the two device resets. Each clears its own
  // counter on every pump, exactly as the fan-out below does — the demo state
  // is the only thing the dashboard reads while there is no device to own the
  // figures.
  const resetDemoRuntime = useCallback(() => {
    setData((prev) => ({
      ...prev,
      pumps: prev.pumps.map((p) => ({ ...p, runtimeHours: 0 })),
    }));
  }, []);

  const resetDemoStarts = useCallback(() => {
    setData((prev) => ({
      ...prev,
      pumps: prev.pumps.map((p) => ({ ...p, currentStarts: 0 })),
    }));
  }, []);

  // Reset is destructive and has no undo, so a Reset button only opens the
  // confirmation. Which of the two session counters is the whole question: they
  // are separate figures with a command each, so a button clears its own on
  // every pump and leaves the other running on every pump.
  const [pendingReset, setPendingReset] = useState<SessionCounter | null>(null);
  const requestResetRuntime = useCallback(() => setPendingReset("runtime"), []);
  const requestResetStarts = useCallback(() => setPendingReset("starts"), []);
  const cancelReset = useCallback(() => setPendingReset(null), []);

  // Held across the whole fan-out rather than read off useDeviceCommand, whose
  // pending keys clear between the six commands — this is one reset as far as
  // the dialog and the buttons are concerned.
  const [resetInFlight, setResetInFlight] = useState<SessionCounter | null>(
    null,
  );

  // The device owns the counter and answers with it, so the reply is what
  // zeroes the readout. Runtime alone has a local accumulator in the provider,
  // and it has to be cleared alongside, or it would keep counting from before
  // the reset; the start count is only ever the device's own report.
  //
  // The firmware has no reset-every-pump command, so one button is one command
  // per pump. They go one at a time: the link is a single serial bridge, and
  // each reply has to be matched to the command that asked for it. Failures are
  // collected and reported once — six timeouts in a row would otherwise queue
  // six toasts saying the same thing.
  const confirmReset = useCallback(async () => {
    if (pendingReset === null) return;
    const counter = pendingReset;

    if (!isConnected) {
      if (counter === "runtime") resetDemoRuntime();
      else resetDemoStarts();
      setPendingReset(null);
      return;
    }

    setResetInFlight(counter);
    const failed: number[] = [];
    try {
      for (const pump of pumps) {
        const reply = await run(
          counter === "runtime"
            ? {
                key: pumpKey(pump.id, "reset-runtime"),
                command: retrofitFloatCommands.resetPumpRuntime(pump.id),
                // Confirmed on the command's own echo, not on the counter it
                // zeroes: the counter also rides every periodic report, so one
                // arriving mid-flight would read as an acknowledgement the
                // device never sent.
                confirms: `pump_${pump.id}_reset_runtime`,
                action: `reset the session runtime for pump ${pump.id}`,
                silent: true,
              }
            : {
                key: pumpKey(pump.id, "reset-starts"),
                command: retrofitFloatCommands.resetPumpStarts(pump.id),
                confirms: `pump_${pump.id}_reset_starts`,
                action: `reset the session starts for pump ${pump.id}`,
                silent: true,
              },
        );

        if (reply === null) failed.push(pump.id);
        else if (counter === "runtime") resetPumpRuntime(pump.id);
      }
    } finally {
      setResetInFlight(null);
    }

    // Recorded on any pump taking it: the counters above the button have moved,
    // so the date they are read against has to move with them. All six failing
    // means nothing was cleared, and the old date still stands.
    if (failed.length < pumps.length) markReset(counter);

    if (failed.length > 0) {
      showToast(
        `Could not reset the session ${counter} for pump${
          failed.length > 1 ? "s" : ""
        } ${failed.join(", ")}.`,
      );
    }
    setPendingReset(null);
  }, [
    isConnected,
    markReset,
    pendingReset,
    pumps,
    resetDemoRuntime,
    resetDemoStarts,
    resetPumpRuntime,
    run,
    showToast,
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

  // Disconnected, a level is written into the selected mode's stored set —
  // which is what the device does with it too, and what makes the other modes
  // keep the levels they were left holding.
  const setDemoColumnLevel = useCallback(
    (columnNumber: number, band: "high" | "low", level: number) => {
      setDemoModeLevels((prev) => {
        const next = { ...prev };
        next[demoOperationMode] = prev[demoOperationMode].map((levels, index) =>
          index === columnNumber - 1 ? { ...levels, [band]: level } : levels,
        );
        return next;
      });
    },
    [demoOperationMode],
  );

  // Keyed by column: the levels belong to the role, and under alteration the
  // pump answering them is the device's to choose.
  const setTriggerLevelHigh = useCallback(
    async (columnNumber: number, level: number) => {
      if (!isConnected) {
        setDemoColumnLevel(columnNumber, "high", level);
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
    [isConnected, run, setDemoColumnLevel],
  );

  const setTriggerLevelLow = useCallback(
    async (columnNumber: number, level: number) => {
      if (!isConnected) {
        setDemoColumnLevel(columnNumber, "low", level);
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
    [isConnected, run, setDemoColumnLevel],
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

  // The motor current band, on exactly the same footing as the water band
  // above: the device owns it, the parent keeps a copy only because the current
  // chart marks the same two levels, and the confirmed value is pushed back up
  // rather than held in two places.
  const deviceCurrentBand = readCurrentBand(readings);
  const currentHigh = isConnected
    ? deviceCurrentBand.high ?? motorCurrentHigh
    : motorCurrentHigh;
  const currentLow = isConnected
    ? deviceCurrentBand.low ?? motorCurrentLow
    : motorCurrentLow;

  useEffect(() => {
    if (currentHigh !== motorCurrentHigh) onMotorCurrentHighChange(currentHigh);
  }, [currentHigh, motorCurrentHigh, onMotorCurrentHighChange]);

  useEffect(() => {
    if (currentLow !== motorCurrentLow) onMotorCurrentLowChange(currentLow);
  }, [currentLow, motorCurrentLow, onMotorCurrentLowChange]);

  const setMotorCurrentHigh = useCallback(
    async (level: number) => {
      if (!isConnected) {
        onMotorCurrentHighChange(level);
        return;
      }
      await run({
        key: "current-band",
        command: retrofitFloatCommands.setCurrentHighThreshold(level),
        confirms: "current_high_thr",
        action: "set the motor current max",
      });
    },
    [isConnected, onMotorCurrentHighChange, run],
  );

  const setMotorCurrentLow = useCallback(
    async (level: number) => {
      if (!isConnected) {
        onMotorCurrentLowChange(level);
        return;
      }
      await run({
        key: "current-band",
        command: retrofitFloatCommands.setCurrentLowThreshold(level),
        confirms: "current_low_thr",
        action: "set the motor current min",
      });
    },
    [isConnected, onMotorCurrentLowChange, run],
  );

  // Live device data takes over once connected, falling back to the demo
  // value only briefly (before the firmware's first periodic report
  // arrives). Disconnected always reads as 0 rather than showing stale/demo data.
  const liveWaterLevel = isConnected ? readCurrentWaterLevel(readings) : null;
  const waterLevel = isConnected ? liveWaterLevel ?? data.waterLevel : 0;

  // Nothing stands in for the motor current while disconnected: unlike the
  // water level it has no demo reading, and a made-up current beside a real
  // alarm band would read as a machine that is running.
  const motorCurrent = isConnected ? readMotorCurrent(readings) ?? 0 : 0;

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

      <OperationModeSection
        mode={operationMode}
        onChange={setOperationMode}
        locked={!editsUnlocked}
        pending={isPending("operation-mode")}
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
            would drift apart the moment either was scrolled.

            The grid is laid out at its own width and left-aligned in the
            panel, so a screen with room to spare leaves it where it is rather
            than stretching it, and one without scrolls it from the same edge.
            Every track is sized to what stands in it (see PUMP_COLUMN_WIDTH),
            which is what keeps the scroll off all but the narrowest
            screens. */}
        <Box sx={{ overflowX: "auto" }}>
          <Box
            sx={{
              display: "grid",
              // The first track is the motor current column's alone — it names
              // itself up its own side, so nothing is written above or below
              // it. The second carries the row labels and, under them, the
              // water level column; it is sized to whichever is wider rather
              // than to a guess at the labels' width. Those two report what
              // the station is doing and are read as a pair, so a gap track
              // stands between them and the pumps that act on it. The pump
              // tracks are narrower than either of the first two: they carry a
              // gauge and its scale, with no title to make room for.
              gridTemplateColumns: `${CURRENT_COLUMN_WIDTH}px auto ${PUMP_GROUP_GAP}px repeat(${columnViews.length}, ${PUMP_COLUMN_WIDTH}px)`,
              columnGap: `${COLUMN_GAP}px`,
              rowGap: 1.5,
              alignItems: "center",
              pb: 0.5,
              width: "max-content",
            }}
          >
            <PumpHeaderRows
              views={columnViews}
              leading={<MotorCurrentHeading />}
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
              <MotorCurrentColumn
                motorCurrent={motorCurrent}
                triggerLevelHigh={currentHigh}
                triggerLevelLow={currentLow}
                onTriggerLevelHighChange={setMotorCurrentHigh}
                onTriggerLevelLowChange={setMotorCurrentLow}
                locked={!editsUnlocked}
                pending={isPending("current-band")}
              />
            </Box>

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

            <PumpGroupGutter />

            {columnViews.map(({ column, pump }) => (
              <Box
                key={column.number}
                sx={{ alignSelf: "start", width: "100%", pt: 1 }}
              >
                <PumpColumn
                  column={column}
                  pump={pump}
                  onTriggerLevelHighChange={setTriggerLevelHigh}
                  onTriggerLevelLowChange={setTriggerLevelLow}
                  locked={!editsUnlocked}
                  thresholdPending={isPending(
                    columnKey(column.number, "threshold"),
                  )}
                />
              </Box>
            ))}

            {/* The counter rows follow the gauges as their own grid rows, not
                as part of each column, so the reset under each row can stretch
                across all six pumps — one button, one counter, every pump. */}
            <PumpCounterRows
              views={columnViews}
              labelsFor={counterLabelsFor}
              onResetRuntime={requestResetRuntime}
              onResetStarts={requestResetStarts}
              locked={!editsUnlocked}
              resetInFlight={resetInFlight}
              lastReset={lastReset}
            />
          </Box>
        </Box>
      </Box>

      <ResetCounterDialog
        open={pendingReset !== null}
        counter={pendingReset ?? "runtime"}
        pumpCount={pumps.length}
        onConfirm={confirmReset}
        onCancel={cancelReset}
        pending={resetInFlight !== null}
      />
    </Box>
  );
}
