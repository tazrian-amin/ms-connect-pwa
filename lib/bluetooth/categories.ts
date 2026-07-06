import type { DeviceCategory } from "@/types/bluetooth";
import { BLUETOOTH_SERVICES, toBluetoothUUID } from "./uuid";

// Every device is a Blues Swan R5 board paired with the same HM-10 UART
// bridge, so requestDevice can't filter by service UUID (they're all
// identical) or by advertised name (many HM-10 clones ignore AT+NAME
// entirely and always broadcast their factory-default name, e.g. "HMSoft").
// So the native scan can't be pre-filtered by category at all - every
// category accepts any nearby UART bridge, and the actual category is
// confirmed after connecting by reading the device's own get_config reply
// (see the connectDevice category check in bluetooth-provider.tsx).
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
    name: "Discharge Water Flow Monitor",
    description: "Discharge Water Flow Remote Monitor",
    icon: "💧",
    image: "/images/devices/discharge-water-flow.svg",
  }),
  hm10Category({
    id: "dewater-water-level",
    name: "Dewater Water Level Monitor",
    description: "Radar Based Water Level Remote Monitor",
    icon: "🌊",
    image: "/images/devices/dewater-water-level.svg",
  }),
  hm10Category({
    id: "dewater-pump-float",
    name: "Dewater Pump Float Replacement",
    description: "Radar Based Float Replacement Remote Monitor",
    icon: "🛟",
    image: "/images/devices/dewater-pump-float.svg",
  }),
  hm10Category({
    id: "conveyor-volumetric-scale",
    name: "Conveyor Volumetric Scale",
    description: "LIDAR Remote Volumetric Monitor",
    icon: "📦",
    image: "/images/devices/conveyor-volumetric-scale.svg",
  }),
  hm10Category({
    id: "conveyor-volumetric-scale-pro",
    name: "Conveyor Volumetric Scale Pro",
    description: "LIDAR & Vision System Remote Volumetric Monitor",
    icon: "📸",
    image: "/images/devices/conveyor-volumetric-scale-pro.svg",
  }),
  hm10Category({
    id: "bin-height-measurement",
    name: "Bin Height Measurement",
    description: "Bin Fill Level Remote Monitor",
    icon: "📏",
    image: "/images/devices/bin-height-measurement.svg",
  }),
];

export function getCategoryById(id: string): DeviceCategory | undefined {
  return DEVICE_CATEGORIES.find((category) => category.id === id);
}
