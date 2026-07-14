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

export interface CommandLogEntry {
  id: string;
  direction: "out" | "in";
  text: string;
  timestamp: Date;
}
