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
  DeviceReading,
} from "@/types/bluetooth";
import {
  connectToDevice,
  disconnectDevice,
  getBluetoothErrorMessage,
  requestDevice,
} from "@/lib/bluetooth/service";
import { getBluetoothSupportMessage } from "@/lib/bluetooth/support";
import {
  parseAdcLine,
  parseJsonLine,
  sendUartCommand,
  subscribeToUartLines,
} from "@/lib/bluetooth/uart";

// Safety cap on retained ADC history to bound memory over long sessions.
const MAX_ADC_SAMPLES = 1000;

// Turns a firmware JSON field name (e.g. "flow_rate_lpm") into a display label.
function humanizeKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

  const unsubscribeRef = useRef<(() => void) | null>(null);
  const rxCharacteristicRef =
    useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const logIdRef = useRef(0);

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

  const handleDisconnect = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    rxCharacteristicRef.current = null;
    setConnectedDevice(null);
    setReadings([]);
    setAdcSamples([]);
    setCommandLog([]);
    setSamplePeriodMs(null);
    setStatus("disconnected");
  }, []);

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

        setStatus("connecting");

        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
        rxCharacteristicRef.current = null;

        const connected = await connectToDevice(device, category.id);

        setConnectedDevice(connected);
        setReadings([]);
        setAdcSamples([]);
        setCommandLog([]);
        setSamplePeriodMs(null);

        let resolveReportedCategory: ((categoryId: string) => void) | null =
          null;
        const reportedCategoryPromise = new Promise<string>((resolve) => {
          resolveReportedCategory = resolve;
        });

        const { characteristic, unsubscribe } = await subscribeToUartLines(
          connected.server,
          (line) => {
            const adcValue = parseAdcLine(line);
            if (adcValue !== null) {
              setAdcSamples((prev) => {
                const next = [
                  ...prev,
                  { timestamp: new Date(), value: adcValue },
                ];
                return next.length > MAX_ADC_SAMPLES
                  ? next.slice(next.length - MAX_ADC_SAMPLES)
                  : next;
              });
              return;
            }

            const json = parseJsonLine(line);
            if (json) {
              appendCommandLog("in", JSON.stringify(json));
              if (typeof json.period_ms === "number") {
                setSamplePeriodMs(json.period_ms);
              }
              if (typeof json.category === "string" && resolveReportedCategory) {
                resolveReportedCategory(json.category);
                resolveReportedCategory = null;
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
            }
          },
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
    [supportMessage, appendCommandLog],
  );

  const sendCommand = useCallback(
    async (commandObj: unknown) => {
      if (!rxCharacteristicRef.current) {
        setError("Not connected");
        return;
      }

      appendCommandLog("out", JSON.stringify(commandObj));
      try {
        await sendUartCommand(rxCharacteristicRef.current, commandObj);
      } catch (err) {
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
