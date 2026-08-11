"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type {
  AdcSample,
  CommandLogEntry,
  ConnectedDevice,
  ConnectionStatus,
  DeviceCategory,
  DeviceCategoryId,
  DeviceReading,
  PumpRuntime,
} from "@/types/bluetooth";
import {
  connectToDevice,
  disconnectDevice,
  getBluetoothErrorMessage,
  requestDevice,
} from "@/lib/bluetooth/service";
import { commandTriggersMcuReset } from "@/lib/bluetooth/commands";
import { logBleEvent } from "@/lib/bluetooth/debug-log";
import { getBluetoothSupportMessage } from "@/lib/bluetooth/support";
import {
  parseAdcLine,
  parseJsonLine,
  sendUartCommand,
  subscribeToUartLines,
  type UartLineHandler,
} from "@/lib/bluetooth/uart";

// Safety cap on retained ADC history to bound memory over long sessions.
const MAX_ADC_SAMPLES = 1000;
// Same bound for the derived water-level history (see waterLevelSamples), and
// for the motor-current history beside it — both are accumulated from the same
// periodic report, one sample each per interval.
const MAX_WATER_LEVEL_SAMPLES = 1000;
const MAX_MOTOR_CURRENT_SAMPLES = 1000;

/** Default round-trip budget for a reply to a single config command. */
const REPLY_TIMEOUT_MS = 10000;

// Turns a firmware JSON field name (e.g. "flow_rate_lpm") into a display label.
function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ReplyWaiter {
  predicate: (json: Record<string, unknown>) => boolean;
  resolve: (json: Record<string, unknown> | null) => void;
}

export type ProvisionProgress = "sending" | "confirming" | "rebooting";

export interface ProvisionResult {
  ok: boolean;
  message?: string;
}

interface BluetoothContextValue {
  supportMessage: string | null;
  isSupportChecked: boolean;
  status: ConnectionStatus;
  error: string | null;
  connectedDevice: ConnectedDevice | null;
  readings: DeviceReading[];
  selectedCategory: DeviceCategory | null;
  connectCategory: (category: DeviceCategory) => Promise<boolean>;
  disconnect: () => Promise<void>;
  clearError: () => void;
  adcSamples: AdcSample[];
  // Time-series of the firmware's current_water_level (ft), accumulated from the
  // periodic JSON reports so the telemetry chart can plot it over time. `readings`
  // only ever holds the latest value per key, so it can't back a chart on its own.
  waterLevelSamples: AdcSample[];
  // Time-series of the firmware's motor_current (amps RMS), accumulated from the
  // same periodic reports as waterLevelSamples — the device samples both off the
  // same filtered-ADC pass, so the two series share a sample period and a clock.
  motorCurrentSamples: AdcSample[];
  // Per-pump runtime, keyed by pump id (1-based), accumulated from the firmware's
  // pump_N_state transitions. See PumpRuntime for the total-runtime formula.
  pumpRuntimes: Record<number, PumpRuntime>;
  resetPumpRuntime: (pumpId: number) => void;
  commandLog: CommandLogEntry[];
  samplePeriodMs: number | null;
  sendCommand: (commandObj: unknown) => Promise<void>;
  /**
   * Sends `commandObj` and resolves with the first inbound JSON line matching
   * `predicate` — or null if none arrives within `timeoutMs`, or the link drops
   * first. Unlike `sendCommand` (which resolves once the write lands), this
   * waits for the device to answer, so a caller can confirm a setting stuck.
   */
  sendCommandAndWait: (
    commandObj: unknown,
    predicate: (json: Record<string, unknown>) => boolean,
    timeoutMs?: number,
  ) => Promise<Record<string, unknown> | null>;
  setSamplePeriodSeconds: (seconds: number) => Promise<void>;
  sendGetConfig: () => Promise<void>;
  clearCommandLog: () => void;
  // null = not yet reported by the device; "" = reported but unset (needs first-time setup).
  deviceProductUid: string | null;
  deviceSerialNumber: string | null;
  provisionDevice: (
    productUid: string,
    serialNumber: string,
    onProgress?: (stage: ProvisionProgress) => void,
  ) => Promise<ProvisionResult>;
  updateDeviceIdentity: (
    productUid: string,
    serialNumber: string,
    onProgress?: (stage: ProvisionProgress) => void,
  ) => Promise<ProvisionResult>;
}

const BluetoothContext = createContext<BluetoothContextValue | null>(null);

const noopSubscribe = () => () => {};

export function BluetoothProvider({ children }: { children: ReactNode }) {
  const supportMessage = useSyncExternalStore(
    noopSubscribe,
    getBluetoothSupportMessage,
    () => null,
  );
  const isSupportChecked = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<ConnectedDevice | null>(
    null,
  );
  const [readings, setReadings] = useState<DeviceReading[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<DeviceCategory | null>(null);
  const [adcSamples, setAdcSamples] = useState<AdcSample[]>([]);
  const [waterLevelSamples, setWaterLevelSamples] = useState<AdcSample[]>([]);
  const [motorCurrentSamples, setMotorCurrentSamples] = useState<AdcSample[]>(
    [],
  );
  const [pumpRuntimes, setPumpRuntimes] = useState<Record<number, PumpRuntime>>(
    {},
  );
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([]);
  const [samplePeriodMs, setSamplePeriodMs] = useState<number | null>(null);
  const [deviceProductUid, setDeviceProductUid] = useState<string | null>(null);
  const [deviceSerialNumber, setDeviceSerialNumber] = useState<string | null>(
    null,
  );

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const rxCharacteristicRef =
    useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const logIdRef = useRef(0);
  const replyWaitersRef = useRef<ReplyWaiter[]>([]);
  // Marks the next disconnect as an expected reboot (not a lost connection).
  // Set before MCU-resetting commands; cleared on error reply or once consumed.
  const expectingResetRef = useRef(false);

  // Mirror live connection state into refs so async flows (updateDeviceIdentity)
  // can poll the latest values instead of capturing stale state in a closure.
  const statusRef = useRef<ConnectionStatus>("idle");
  const productUidRef = useRef<string | null>(null);
  const serialNumberRef = useRef<string | null>(null);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    productUidRef.current = deviceProductUid;
  }, [deviceProductUid]);
  useEffect(() => {
    serialNumberRef.current = deviceSerialNumber;
  }, [deviceSerialNumber]);

  const clearError = useCallback(() => setError(null), []);

  const appendCommandLog = useCallback(
    (direction: CommandLogEntry["direction"], text: string) => {
      logIdRef.current += 1;
      const entry: CommandLogEntry = {
        id: `${Date.now()}-${logIdRef.current}`,
        direction,
        text,
        timestamp: new Date(),
      };
      setCommandLog((prev) => [...prev, entry]);
    },
    [],
  );

  const clearCommandLog = useCallback(() => setCommandLog([]), []);

  // Zeroes a pump's *current* runtime; if it's currently ON, restarts the
  // running interval from now so the live counter continues from 0. The
  // lifetime total is deliberately left untouched — it is never resettable.
  //
  // Local-only for now: the firmware has no reset command key yet, so the
  // zeroed currentSeconds is optimistic and the device's next
  // pump_N_current_runtime report will overwrite it.
  const resetPumpRuntime = useCallback((pumpId: number) => {
    setPumpRuntimes((prev) => {
      const current = prev[pumpId];
      if (!current) return prev;
      const nowSeconds = Date.now() / 1000;
      return {
        ...prev,
        [pumpId]: {
          ...current,
          accumulatedSeconds: 0,
          onSinceEpoch: current.isOn ? nowSeconds : null,
          currentSeconds: current.currentSeconds === undefined ? undefined : 0,
          countersReportedAtEpoch:
            current.countersReportedAtEpoch === undefined
              ? undefined
              : nowSeconds,
        },
      };
    });
  }, []);

  // Shared by initial connect and post-reset reconnection; onCategoryReported
  // is only used for the initial connect's category-mismatch check.
  const createUartLineHandler = useCallback(
    (onCategoryReported?: (categoryId: string) => void): UartLineHandler =>
      (line) => {
        const adcValue = parseAdcLine(line);
        if (adcValue !== null) {
          setAdcSamples((prev) => {
            const next = [...prev, { timestamp: new Date(), value: adcValue }];
            return next.length > MAX_ADC_SAMPLES
              ? next.slice(next.length - MAX_ADC_SAMPLES)
              : next;
          });
          return;
        }

        const json = parseJsonLine(line);
        if (!json) return;

        appendCommandLog("in", JSON.stringify(json));
        // set_sample_period's own reply uses "period_ms"; get_config/get_status
        // report the same value as "sample_period_ms" — firmware uses both names
        // depending on which command triggered the reply.
        if (typeof json.period_ms === "number") {
          setSamplePeriodMs(json.period_ms);
        } else if (typeof json.sample_period_ms === "number") {
          setSamplePeriodMs(json.sample_period_ms);
        }
        // The firmware stamps each water-level / pump-state report with a device
        // `time` (Unix seconds from the Notecard clock), or null before that
        // clock is set — fall back to the browser clock only then.
        const eventEpochSeconds =
          typeof json.time === "number" && Number.isFinite(json.time)
            ? json.time
            : null;
        const eventTimestamp =
          eventEpochSeconds !== null
            ? new Date(eventEpochSeconds * 1000)
            : new Date();
        const eventSeconds = eventEpochSeconds ?? Date.now() / 1000;

        if (json.current_water_level !== undefined) {
          const waterLevel = Number(json.current_water_level);
          if (Number.isFinite(waterLevel)) {
            setWaterLevelSamples((prev) => {
              const next = [...prev, { timestamp: eventTimestamp, value: waterLevel }];
              return next.length > MAX_WATER_LEVEL_SAMPLES
                ? next.slice(next.length - MAX_WATER_LEVEL_SAMPLES)
                : next;
            });
          }
        }

        if (json.motor_current !== undefined) {
          const motorCurrent = Number(json.motor_current);
          if (Number.isFinite(motorCurrent)) {
            setMotorCurrentSamples((prev) => {
              const next = [
                ...prev,
                { timestamp: eventTimestamp, value: motorCurrent },
              ];
              return next.length > MAX_MOTOR_CURRENT_SAMPLES
                ? next.slice(next.length - MAX_MOTOR_CURRENT_SAMPLES)
                : next;
            });
          }
        }

        // Device-owned runtime counters, in seconds. UPCOMING FIRMWARE FEATURE:
        // these key names are provisional — if the firmware ships different ones,
        // this block is the only place that needs updating.
        //   pump_N_total_runtime   lifetime since installation, never reset
        //   pump_N_current_runtime since the user's last reset
        for (const [key, val] of Object.entries(json)) {
          const counterMatch = key.match(
            /^pump_(\d+)_(total|current)_runtime$/,
          );
          if (!counterMatch) continue;
          const seconds = Number(val);
          if (!Number.isFinite(seconds) || seconds < 0) continue;
          const pumpId = Number(counterMatch[1]);
          const field =
            counterMatch[2] === "total" ? "totalSeconds" : "currentSeconds";
          setPumpRuntimes((prev) => {
            const current = prev[pumpId] ?? {
              isOn: false,
              accumulatedSeconds: 0,
              onSinceEpoch: null,
            };
            return {
              ...prev,
              [pumpId]: {
                ...current,
                [field]: seconds,
                countersReportedAtEpoch: eventSeconds,
              },
            };
          });
        }

        // pump_N_state is edge-triggered: each push is an actual ON/OFF flip, so
        // we close out the previous ON interval into accumulatedSeconds using the
        // device timestamps and start/stop the running interval accordingly.
        for (const [key, val] of Object.entries(json)) {
          const pumpMatch = key.match(/^pump_(\d+)_state$/);
          if (!pumpMatch) continue;
          const pumpId = Number(pumpMatch[1]);
          const nextOn = val === "on";
          setPumpRuntimes((prev) => {
            const current = prev[pumpId] ?? {
              isOn: false,
              accumulatedSeconds: 0,
              onSinceEpoch: null,
            };
            if (nextOn === current.isOn) return prev;
            if (nextOn) {
              return {
                ...prev,
                [pumpId]: { ...current, isOn: true, onSinceEpoch: eventSeconds },
              };
            }
            const runtimeToAdd =
              current.onSinceEpoch !== null
                ? Math.max(0, eventSeconds - current.onSinceEpoch)
                : 0;
            return {
              ...prev,
              [pumpId]: {
                ...current,
                isOn: false,
                accumulatedSeconds: current.accumulatedSeconds + runtimeToAdd,
                onSinceEpoch: null,
              },
            };
          });
        }

        if (typeof json.product_uid === "string") {
          setDeviceProductUid(json.product_uid);
        }
        if (typeof json.serial_number === "string") {
          setDeviceSerialNumber(json.serial_number);
        }
        if (typeof json.category === "string") {
          onCategoryReported?.(json.category);
        }
        if (json.status === "error") {
          // Command rejected — MCU won't reset, so don't treat the next disconnect as a reboot.
          expectingResetRef.current = false;
        }

        if (replyWaitersRef.current.length > 0) {
          replyWaitersRef.current = replyWaitersRef.current.filter((waiter) => {
            if (waiter.predicate(json)) {
              waiter.resolve(json);
              return false;
            }
            return true;
          });
        }

        const now = new Date();
        for (const [key, val] of Object.entries(json)) {
          if (key === "cmd" || key === "period_ms" || key === "category") continue;
          setReadings((prev) => {
            const filtered = prev.filter((r) => r.id !== key);
            return [
              ...filtered,
              { id: key, label: humanizeKey(key), value: String(val), timestamp: now },
            ];
          });
        }
      },
    [appendCommandLog],
  );

  // Reconnects to the already-paired device after an MCU-resetting command
  // drops the BLE link, once the MCU has had time to boot back up.
  const reconnectAfterReset = useCallback(
    async (device: BluetoothDevice, categoryId: DeviceCategoryId) => {
      setStatus("connecting");
      setError(null);

      // MCU runs the same startup sequence (sensor init, Notehub sync) on any
      // reset, not just first-boot setup — same wait as provisionDevice.
      await sleep(5000);

      const deadline = Date.now() + 120000;
      while (Date.now() < deadline) {
        try {
          const connected = await connectToDevice(device, categoryId);
          logBleEvent(`Reconnected after MCU reset: ${connected.name}`);

          const { characteristic, unsubscribe } = await subscribeToUartLines(
            connected.server,
            createUartLineHandler(),
          );
          rxCharacteristicRef.current = characteristic;
          unsubscribeRef.current = unsubscribe;
          setConnectedDevice(connected);

          appendCommandLog("out", JSON.stringify({ cmd: "get_config" }));
          await sendUartCommand(characteristic, { cmd: "get_config" });

          setStatus("connected");
          return;
        } catch {
          await sleep(3000);
        }
      }

      setStatus("disconnected");
      setError(
        "Device restarted but didn't reconnect automatically. Reconnect manually.",
      );
    },
    [appendCommandLog, createUartLineHandler],
  );

  const handleDisconnect = useCallback(() => {
    logBleEvent("Disconnected");
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    rxCharacteristicRef.current = null;
    replyWaitersRef.current.forEach((waiter) => waiter.resolve(null));
    replyWaitersRef.current = [];

    const shouldReconnect = expectingResetRef.current;
    expectingResetRef.current = false;
    const deviceForReconnect = connectedDevice?.device;
    const categoryIdForReconnect = connectedDevice?.categoryId;

    setConnectedDevice(null);
    setReadings([]);
    setAdcSamples([]);
    setWaterLevelSamples([]);
    setMotorCurrentSamples([]);
    setPumpRuntimes({});
    setCommandLog([]);
    setSamplePeriodMs(null);
    setDeviceProductUid(null);
    setDeviceSerialNumber(null);

    if (shouldReconnect && deviceForReconnect && categoryIdForReconnect) {
      void reconnectAfterReset(deviceForReconnect, categoryIdForReconnect);
    } else {
      setStatus("disconnected");
    }
  }, [connectedDevice, reconnectAfterReset]);

  useEffect(() => {
    if (!connectedDevice) return;

    const { device } = connectedDevice;
    const onDisconnected = () => handleDisconnect();

    device.addEventListener("gattserverdisconnected", onDisconnected);
    return () => {
      device.removeEventListener("gattserverdisconnected", onDisconnected);
    };
  }, [connectedDevice, handleDisconnect]);

  const connectCategory = useCallback(
    async (category: DeviceCategory): Promise<boolean> => {
      if (supportMessage) {
        setError(supportMessage);
        return false;
      }

      setSelectedCategory(category);
      setStatus("scanning");
      setError(null);

      try {
        const device = await requestDevice(category);

        logBleEvent(
          `Device selected: ${device.name ?? "Unknown"} (${device.id}) for category "${category.id}"`,
        );
        setStatus("connecting");

        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
        rxCharacteristicRef.current = null;

        const connected = await connectToDevice(device, category.id);

        logBleEvent(`GATT connected: ${connected.name}`);
        setConnectedDevice(connected);
        setReadings([]);
        setAdcSamples([]);
        setWaterLevelSamples([]);
        setMotorCurrentSamples([]);
        setPumpRuntimes({});
        setCommandLog([]);
        setSamplePeriodMs(null);
        setDeviceProductUid(null);
        setDeviceSerialNumber(null);

        let resolveReportedCategory: ((categoryId: string) => void) | null =
          null;
        const reportedCategoryPromise = new Promise<string>((resolve) => {
          resolveReportedCategory = resolve;
        });

        const { characteristic, unsubscribe } = await subscribeToUartLines(
          connected.server,
          createUartLineHandler((categoryId) => {
            resolveReportedCategory?.(categoryId);
            resolveReportedCategory = null;
          }),
        );

        rxCharacteristicRef.current = characteristic;
        unsubscribeRef.current = unsubscribe;

        // The native picker can't filter by category (see categories.ts), so
        // confirm it now via the device's own get_config reply.
        appendCommandLog("out", JSON.stringify({ cmd: "get_config" }));
        await sendUartCommand(characteristic, { cmd: "get_config" });

        const reportedCategory = await Promise.race([
          reportedCategoryPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);

        if (reportedCategory !== null && reportedCategory !== category.id) {
          unsubscribe();
          rxCharacteristicRef.current = null;
          unsubscribeRef.current = null;
          await disconnectDevice(device);
          setConnectedDevice(null);
          setStatus("error");
          setError(
            `This device reports category "${reportedCategory}", not "${category.name}". Choose the matching category and reconnect.`,
          );
          return false;
        }

        setStatus("connected");
        setError(null);
        return true;
      } catch (err) {
        setError(getBluetoothErrorMessage(err));
        setStatus("error");
        return false;
      }
    },
    [supportMessage, appendCommandLog, createUartLineHandler],
  );

  const sendCommand = useCallback(
    async (commandObj: unknown) => {
      if (!rxCharacteristicRef.current) {
        setError("Not connected");
        return;
      }

      const resetsOnSuccess = commandTriggersMcuReset(commandObj);
      if (resetsOnSuccess) {
        expectingResetRef.current = true;
      }

      appendCommandLog("out", JSON.stringify(commandObj));
      try {
        await sendUartCommand(rxCharacteristicRef.current, commandObj);
      } catch (err) {
        if (resetsOnSuccess) {
          expectingResetRef.current = false;
        }
        setError(getBluetoothErrorMessage(err));
      }
    },
    [appendCommandLog],
  );

  const sendGetConfig = useCallback(
    () => sendCommand({ cmd: "get_config" }),
    [sendCommand],
  );

  const setSamplePeriodSeconds = useCallback(
    (seconds: number) =>
      sendCommand({ cmd: "set_sample_period", period_ms: seconds * 1000 }),
    [sendCommand],
  );

  // Resolves with the next inbound JSON line matching `predicate`, or null on timeout.
  const waitForReply = useCallback(
    (
      predicate: (json: Record<string, unknown>) => boolean,
      timeoutMs: number,
    ): Promise<Record<string, unknown> | null> => {
      return new Promise((resolve) => {
        const waiter: ReplyWaiter = {
          predicate,
          resolve: (json) => {
            clearTimeout(timer);
            replyWaitersRef.current = replyWaitersRef.current.filter(
              (w) => w !== waiter,
            );
            resolve(json);
          },
        };
        const timer = setTimeout(() => {
          replyWaitersRef.current = replyWaitersRef.current.filter(
            (w) => w !== waiter,
          );
          resolve(null);
        }, timeoutMs);
        replyWaitersRef.current.push(waiter);
      });
    },
    [],
  );

  const sendCommandAndWait = useCallback(
    async (
      commandObj: unknown,
      predicate: (json: Record<string, unknown>) => boolean,
      timeoutMs: number = REPLY_TIMEOUT_MS,
    ) => {
      // Registered before the write, or a reply that beats this line is missed.
      const reply = waitForReply(predicate, timeoutMs);
      await sendCommand(commandObj);
      return reply;
    },
    [sendCommand, waitForReply],
  );

  // Provisioning protocol: firmware blocks until it gets setup_device (silent,
  // no reply) then confirm_setup (replies ok/error), then reboots (~15-20s).
  // The HM-10 link can take ~18s for the confirm_setup round trip alone (BLE
  // latency, not firmware), so timeouts below carry generous margin.
  // confirm_setup errors "ProductUID and SerialNumber must be set first" if
  // setup_device's silent write was dropped — retry the pair a few times.
  const MAX_SETUP_ATTEMPTS = 3;
  const provisionDevice = useCallback(
    async (
      productUid: string,
      serialNumber: string,
      onProgress?: (stage: ProvisionProgress) => void,
    ): Promise<ProvisionResult> => {
      if (!rxCharacteristicRef.current) {
        return { ok: false, message: "Not connected to a device." };
      }

      let lastMessage = "Setup failed.";
      for (let attempt = 1; attempt <= MAX_SETUP_ATTEMPTS; attempt++) {
        if (!rxCharacteristicRef.current) {
          return {
            ok: false,
            message: "Device disconnected during setup. Reconnect and try again.",
          };
        }

        onProgress?.("sending");
        await sendCommand({
          cmd: "setup_device",
          product_uid: productUid,
          serial_number: serialNumber,
        });

        onProgress?.("confirming");
        const confirmReply = waitForReply(
          (json) => typeof json.status === "string" && typeof json.msg === "string",
          45000,
        );
        await sendCommand({ cmd: "confirm_setup" });
        const reply = await confirmReply;

        if (!reply) {
          return {
            ok: false,
            message: "No response from the device. Check the connection and try again.",
          };
        }
        if (reply.status === "ok") {
          lastMessage = "";
          break;
        }

        lastMessage = typeof reply.msg === "string" ? reply.msg : lastMessage;
        // status === "error": setup_device wasn't stored — loop and resend it.
      }

      if (lastMessage) {
        return { ok: false, message: lastMessage };
      }

      onProgress?.("rebooting");
      await sleep(5000);
      const deadline = Date.now() + 120000;
      while (Date.now() < deadline) {
        if (!rxCharacteristicRef.current) {
          return {
            ok: false,
            message: "Device disconnected while restarting. Reconnect and try again.",
          };
        }

        const configReply = waitForReply(
          (json) =>
            typeof json.product_uid === "string" &&
            typeof json.serial_number === "string",
          15000,
        );
        await sendCommand({ cmd: "get_config" });
        const config = await configReply;

        if (
          config &&
          typeof config.product_uid === "string" &&
          config.product_uid.length > 0 &&
          typeof config.serial_number === "string" &&
          config.serial_number.length > 0
        ) {
          return { ok: true };
        }

        await sleep(3000);
      }

      return {
        ok: false,
        message: "Timed out waiting for the device to restart. It may still be rebooting.",
      };
    },
    [sendCommand, waitForReply],
  );

  // Runtime identity change for an already-provisioned device. Firmware
  // (main.cpp tryHandleFlatIdentityCommand) saves the field(s) to EEPROM, syncs
  // Notehub, then NVIC_SystemReset()s -- which drops the BLE link. sendCommand
  // flags the reset (commandTriggersMcuReset) so handleDisconnect auto-reconnects
  // via reconnectAfterReset, which re-reads get_config; we wait for that to
  // report the new identity, then resolve so the caller's loader can finish.
  const updateDeviceIdentity = useCallback(
    async (
      productUid: string,
      serialNumber: string,
      onProgress?: (stage: ProvisionProgress) => void,
    ): Promise<ProvisionResult> => {
      if (!rxCharacteristicRef.current) {
        return { ok: false, message: "Not connected to a device." };
      }

      onProgress?.("sending");
      const ackReply = waitForReply(
        (json) => typeof json.status === "string",
        15000,
      );
      // Flat identity write; firmware accepts both fields in one message.
      await sendCommand({
        set_product_uid: productUid,
        set_serial_number: serialNumber,
      });
      const ack = await ackReply;
      if (ack && ack.status === "error") {
        return {
          ok: false,
          message:
            typeof ack.msg === "string" ? ack.msg : "Device rejected the update.",
        };
      }

      onProgress?.("rebooting");
      // Wait for the hard reset to drop the link (firmware syncs Notehub ~6s
      // before NVIC_SystemReset). Also guards the no-op case where the submitted
      // values already match, so we don't resolve before the reboot happens.
      const dropDeadline = Date.now() + 30000;
      while (rxCharacteristicRef.current && Date.now() < dropDeadline) {
        await sleep(500);
      }

      // Then wait for the automatic reconnect's get_config to report the new
      // identity (~30-60s: MCU boot + Notecard sync + BLE reconnect).
      const deadline = Date.now() + 180000;
      while (Date.now() < deadline) {
        if (
          statusRef.current === "connected" &&
          productUidRef.current === productUid &&
          serialNumberRef.current === serialNumber
        ) {
          return { ok: true };
        }
        if (statusRef.current === "disconnected") {
          return {
            ok: false,
            message:
              "Device restarted but didn't reconnect automatically. Reconnect manually.",
          };
        }
        await sleep(1000);
      }

      return {
        ok: false,
        message: "Timed out waiting for the device to restart. It may still be rebooting.",
      };
    },
    [sendCommand, waitForReply],
  );

  const disconnect = useCallback(async () => {
    if (connectedDevice) {
      await disconnectDevice(connectedDevice.device);
    }
    handleDisconnect();
    setStatus("idle");
  }, [connectedDevice, handleDisconnect]);

  const value = useMemo<BluetoothContextValue>(
    () => ({
      supportMessage,
      isSupportChecked,
      status,
      error,
      connectedDevice,
      readings,
      selectedCategory,
      connectCategory,
      disconnect,
      clearError,
      adcSamples,
      waterLevelSamples,
      motorCurrentSamples,
      pumpRuntimes,
      resetPumpRuntime,
      commandLog,
      samplePeriodMs,
      sendCommand,
      sendCommandAndWait,
      setSamplePeriodSeconds,
      sendGetConfig,
      clearCommandLog,
      deviceProductUid,
      deviceSerialNumber,
      provisionDevice,
      updateDeviceIdentity,
    }),
    [
      supportMessage,
      isSupportChecked,
      status,
      error,
      connectedDevice,
      readings,
      selectedCategory,
      connectCategory,
      disconnect,
      clearError,
      adcSamples,
      waterLevelSamples,
      motorCurrentSamples,
      pumpRuntimes,
      resetPumpRuntime,
      commandLog,
      samplePeriodMs,
      sendCommand,
      sendCommandAndWait,
      setSamplePeriodSeconds,
      sendGetConfig,
      clearCommandLog,
      deviceProductUid,
      deviceSerialNumber,
      provisionDevice,
      updateDeviceIdentity,
    ],
  );

  return (
    <BluetoothContext.Provider value={value}>
      {children}
    </BluetoothContext.Provider>
  );
}

export function useBluetooth(): BluetoothContextValue {
  const context = useContext(BluetoothContext);
  if (!context) {
    throw new Error("useBluetooth must be used within a BluetoothProvider");
  }
  return context;
}
