export function isBluetoothSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof window !== "undefined" &&
    "bluetooth" in navigator
  );
}

export function getBluetoothSupportMessage(): string | null {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return null;
  }

  if (!("bluetooth" in navigator)) {
    return "Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera on a supported device.";
  }

  if (!window.isSecureContext) {
    return "Web Bluetooth requires a secure context (HTTPS or localhost).";
  }

  return null;
}
