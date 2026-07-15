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
  commandLog: CommandLogEntry[];
  samplePeriodMs: number | null;
  sendCommand: (commandObj: unknown) => Promise<void>;
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
  // Set right before sending a command that resets the MCU (set_config,
  // set_product_uid/set_serial_number, reset_config) so the next
  // gattserverdisconnected event is treated as an expected reboot instead of
  // a lost connection. Cleared on an error reply (the MCU didn't reset) or
  // once consumed by the disconnect handler.
  const expectingResetRef = useRef(false);

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

  // Builds the notification handler shared by the initial connect and by
  // post-reset reconnection. `onCategoryReported` is only needed for the
  // initial connect's category-mismatch check.
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
        if (typeof json.period_ms === "number") {
          setSamplePeriodMs(json.period_ms);
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
          // A reset-triggering command was rejected (e.g. bad payload), so
          // the MCU won't actually reset — don't treat the next disconnect
          // (if any, e.g. the user walks out of range) as an expected reboot.
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

  // After a command that resets the MCU (set_config, set_product_uid/
  // set_serial_number, reset_config), the BLE link drops on its own — this
  // reconnects using the already-paired `device` object (no new picker
  // prompt needed) once the MCU has had time to come back up.
  const reconnectAfterReset = useCallback(
    async (device: BluetoothDevice, categoryId: DeviceCategoryId) => {
      setStatus("connecting");
      setError(null);

      // Same margins as provisionDevice's post-boot wait: the MCU goes
      // through the same startup sequence (sensor init, Notehub sync) on any
      // reset, not just first-boot setup.
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

  // First-time device provisioning: the firmware blocks in a setup loop until
  // it receives setup_device (silently, no reply) followed by confirm_setup
  // (which replies ok/error), then reboots (~15-20s) before it's usable again.
  //
  // This HM-10 link has been observed taking ~18s just for the confirm_setup
  // round trip (BLE connection-interval/notification latency, not firmware
  // processing time), so every timeout below carries generous margin rather
  // than the firmware's own processing time.
  //
  // confirm_setup can reply {"status":"error","msg":"ProductUID and
  // SerialNumber must be set first"} if setup_device's silent write never
  // landed (e.g. dropped BLE packet) — the protocol's fix is to resend
  // setup_device, so retry the pair a few times before giving up.
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
      commandLog,
      samplePeriodMs,
      sendCommand,
      setSamplePeriodSeconds,
      sendGetConfig,
      clearCommandLog,
      deviceProductUid,
      deviceSerialNumber,
      provisionDevice,
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
      commandLog,
      samplePeriodMs,
      sendCommand,
      setSamplePeriodSeconds,
      sendGetConfig,
      clearCommandLog,
      deviceProductUid,
      deviceSerialNumber,
      provisionDevice,
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
