// Console diagnostics for BLE traffic so field debugging can follow every
// byte exchanged with a device from the browser devtools.

function timestamp(): string {
  return new Date().toISOString();
}

/** Log a payload written to the device (app → device). */
export function logBleSend(payload: string): void {
  console.log(`[BLE ${timestamp()}] → ${payload}`);
}

/** Log a line received from the device (device → app). */
export function logBleReceive(line: string): void {
  console.log(`[BLE ${timestamp()}] ← ${line}`);
}

/** Log a connection lifecycle event (connect, disconnect, etc.). */
export function logBleEvent(message: string): void {
  console.log(`[BLE ${timestamp()}] • ${message}`);
}
