import type { DeviceCategory } from "@/types/bluetooth";
import { BLUETOOTH_SERVICES, toBluetoothUUID } from "./uuid";

// Every device uses the same HM-10 UART bridge with identical service UUIDs
// and often the same factory-default advertised name, so the native scan
// can't be pre-filtered by category — any category accepts any nearby UART
// bridge, and the real category is confirmed post-connect via get_config
// (see bluetooth-provider.tsx's category check).
function hm10Category(category: Omit<DeviceCategory, "filters">): DeviceCategory {
  return {
    ...category,
    filters: {
      acceptAllDevices: true,
      optionalServices: [toBluetoothUUID(BLUETOOTH_SERVICES.HM10_UART)],
    },
  };
}

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  hm10Category({
    id: "discharge-water-flow",
    title: "Discharge Water Flow Monitor",
    name: "Discharge Water Flow Remote Monitor",
    description: "Monitors water flow in discharge systems and provides real-time data for analysis and alerts.",
    icon: "💧",
    image: "/images/devices/discharge-water-flow.svg",
  }),
  hm10Category({
    id: "dewater-water-level",
    title: "Dewater Water Level Monitor",
    name: "Radar Based Water Level Remote Monitor",
    description: "Reports Instantaneous Water Level;  Sends Alerts When Outside User Settable High & Low Levels",
    icon: "🌊",
    image: "/images/devices/dewater-water-level.svg",
  }),
  hm10Category({
    id: "dewater-pump-float",
    title: "Dewater Pump Float Replacement",
    name: "Radar Based Float Replacement Remote Monitor",
    description: "Controls up to 6 pumps based on both the current water height and user set high and low levels for each pump control relay. Eliminates the maintenance needs of floats.​",
    icon: "🛟",
    image: "/images/devices/dewater-pump-float.svg",
  }),
  hm10Category({
    id: "conveyor-volumetric-scale",
    title: "Conveyor Volumetric Scale",
    name: "LIDAR Remote Volumetric Monitor",
    description: "Reports the instantaneous and aggregated production volume.",
    icon: "📦",
    image: "/images/devices/conveyor-volumetric-scale.svg",
  }),
  hm10Category({
    id: "conveyor-volumetric-scale-pro",
    title: "Conveyor Volumetric Scale Pro",
    name: "LIDAR & Vision System Remote Volumetric Monitor",
    description: "Reports the instantaneous and aggregated production volume along with added insights for the quality of material.",
    icon: "📸",
    image: "/images/devices/conveyor-volumetric-scale-pro.svg",
  }),
  hm10Category({
    id: "bin-height-measurement",
    title: "Bin Height Measurement",
    name: "Bin Fill Level Remote Monitor",
    description: "Measures the height of material in bins and provides real-time data for inventory management.",
    icon: "📏",
    image: "/images/devices/bin-height-measurement.svg",
  }),
];

export function getCategoryById(id: string): DeviceCategory | undefined {
  return DEVICE_CATEGORIES.find((category) => category.id === id);
}
