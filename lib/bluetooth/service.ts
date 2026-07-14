import type { ConnectedDevice, DeviceCategory } from "@/types/bluetooth";

export async function requestDevice(
  category: DeviceCategory,
): Promise<BluetoothDevice> {
  const bluetooth =
    typeof navigator !== "undefined" ? navigator.bluetooth : undefined;

  if (!bluetooth?.requestDevice) {
    throw new Error("Web Bluetooth is not available in this browser.");
  }

  return bluetooth.requestDevice({
    ...category.filters,
  });
}

export async function connectToDevice(
  device: BluetoothDevice,
  categoryId: ConnectedDevice["categoryId"],
): Promise<ConnectedDevice> {
  const server = await device.gatt!.connect();

  device.addEventListener("gattserverdisconnected", () => {
    // Disconnection is handled by the provider via the same event.
  });

  return {
    id: device.id,
    name: device.name ?? "Unknown Device",
    categoryId,
    device,
    server,
    connectedAt: new Date(),
  };
}

export async function disconnectDevice(device: BluetoothDevice): Promise<void> {
  if (device.gatt?.connected) {
    device.gatt.disconnect();
  }
}

export function getBluetoothErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotFoundError") {
      return "No device selected or no matching devices found nearby.";
    }
    if (error.name === "NotAllowedError") {
      return "Bluetooth permission was denied. Please allow access and try again.";
    }
    if (error.name === "NetworkError") {
      return "Connection failed. Make sure the device is powered on and in range.";
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}
