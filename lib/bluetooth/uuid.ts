export const BLUETOOTH_SERVICES = {
  // HM-10 transparent UART bridge (not an assigned Bluetooth SIG number).
  // All monitoring devices use this module, since the Blues Swan R5 board
  // has no Bluetooth radio of its own.
  HM10_UART: 0xffe0,
} as const;

export const BLUETOOTH_CHARACTERISTICS = {
  HM10_UART_TX: 0xffe1,
} as const;

export function toBluetoothUUID(value: number): BluetoothServiceUUID {
  return value;
}
