import { logBleReceive, logBleSend } from "./debug-log";
import { BLUETOOTH_CHARACTERISTICS, BLUETOOTH_SERVICES, toBluetoothUUID } from "./uuid";

// Classic BLE 4.0 ATT MTU (23 bytes) minus the 3-byte header, matching the HM-10's default link budget.
const MAX_BLE_WRITE_CHUNK_BYTES = 20;

export type UartLineHandler = (line: string) => void;

function createLineReader(onLine: UartLineHandler) {
  let byteBuffer: string[] = [];

  return (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const dataView = target.value;
    if (!dataView) return;

    let incomingStr = "";
    for (let i = 0; i < dataView.byteLength; i++) {
      incomingStr += String.fromCharCode(dataView.getUint8(i));
    }

    byteBuffer.push(...incomingStr);
    const lines = byteBuffer.join("").split(/\r?\n/);

    // Keep the last incomplete line in the buffer for the next chunk.
    byteBuffer = lines[lines.length - 1].split("");

    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (line.length > 0) {
        logBleReceive(line);
        onLine(line);
      }
    }
  };
}

export async function subscribeToUartLines(
  server: BluetoothRemoteGATTServer,
  onLine: UartLineHandler,
): Promise<{
  characteristic: BluetoothRemoteGATTCharacteristic;
  unsubscribe: () => void;
}> {
  const service = await server.getPrimaryService(
    toBluetoothUUID(BLUETOOTH_SERVICES.HM10_UART),
  );
  const characteristic = await service.getCharacteristic(
    toBluetoothUUID(BLUETOOTH_CHARACTERISTICS.HM10_UART_TX),
  );

  const handler = createLineReader(onLine);
  characteristic.addEventListener("characteristicvaluechanged", handler);
  await characteristic.startNotifications();

  return {
    characteristic,
    unsubscribe: () => {
      characteristic.removeEventListener("characteristicvaluechanged", handler);
      characteristic.stopNotifications().catch(() => undefined);
    },
  };
}

// Writes a JSON command to the HM-10's transparent UART characteristic, chunked to the BLE write limit.
export async function sendUartCommand(
  characteristic: BluetoothRemoteGATTCharacteristic,
  commandObj: unknown,
): Promise<void> {
  const payload = JSON.stringify(commandObj) + "\n";
  logBleSend(JSON.stringify(commandObj));
  const bytes = new TextEncoder().encode(payload);

  for (
    let offset = 0;
    offset < bytes.length;
    offset += MAX_BLE_WRITE_CHUNK_BYTES
  ) {
    const chunk = bytes.slice(offset, offset + MAX_BLE_WRITE_CHUNK_BYTES);
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }
  }
}

// Parses "ADC value:<number>" lines from the firmware's plain-text telemetry stream.
export function parseAdcLine(line: string): number | null {
  const match = line.match(/ADC value:(\d+)/i);
  if (!match) return null;
  return parseInt(match[1], 10);
}

// Firmware command replies (e.g. set_sample_period, get_config) are single-line JSON.
export function parseJsonLine(line: string): Record<string, unknown> | null {
  if (!line.startsWith("{")) return null;
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}
