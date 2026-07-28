/// <reference types="web-bluetooth" />

export type DeviceCategoryId =
  | "discharge-water-flow"
  | "dewater-water-level"
  | "dewater-pump-float"
  | "conveyor-volumetric-scale"
  | "conveyor-volumetric-scale-pro"
  | "bin-height-measurement";

export interface DeviceCategory {
  id: DeviceCategoryId;
  title: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  filters: RequestDeviceOptions;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  categoryId: DeviceCategoryId;
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
  connectedAt: Date;
}

export interface DeviceReading {
  id: string;
  label: string;
  value: string;
  timestamp: Date;
}

export type ConnectionStatus =
  | "idle"
  | "scanning"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface BluetoothError {
  message: string;
  code?: string;
}

export interface AdcSample {
  timestamp: Date;
  value: number;
}

// Per-pump runtime accumulator, derived from the firmware's edge-triggered
// pump_N_state pushes (each carries a device `time` in Unix seconds). Session
// runtime = accumulatedSeconds + (isOn ? now - onSinceEpoch : 0).
//
// The device-owned counters below (total/current) are the authoritative values
// once the firmware reports them; the session fields still supply the live
// count-up between those periodic reports.
export interface PumpRuntime {
  isOn: boolean;
  /** Total completed ON→OFF runtime observed this session, in seconds. */
  accumulatedSeconds: number;
  /** Unix seconds when the current ON interval began; null while off. */
  onSinceEpoch: number | null;
  /**
   * Device lifetime runtime since installation, in seconds. Never reset.
   * Undefined until the firmware reports `pump_N_total_runtime`.
   */
  totalSeconds?: number;
  /**
   * Device runtime since the user's last reset, in seconds.
   * Undefined until the firmware reports `pump_N_current_runtime`.
   */
  currentSeconds?: number;
  /**
   * Unix seconds when totalSeconds/currentSeconds were last reported. Marks
   * how far the device counters already account for, so the live count-up only
   * adds the ON time the report didn't cover.
   */
  countersReportedAtEpoch?: number;
}

export interface CommandLogEntry {
  id: string;
  direction: "out" | "in";
  text: string;
  timestamp: Date;
}
