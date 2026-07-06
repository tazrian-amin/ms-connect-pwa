"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DeviceListProps {
  devices: BluetoothDevice[];
  onSelect: (device: BluetoothDevice) => void;
  loading?: boolean;
  selectedId?: string;
}

export function DeviceList({
  devices,
  onSelect,
  loading = false,
  selectedId,
}: DeviceListProps) {
  if (devices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No devices found yet. Tap &quot;Scan for Devices&quot; to discover
          nearby Bluetooth devices.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2" role="list">
      {devices.map((device) => {
        const isSelected = selectedId === device.id;

        return (
          <li key={device.id}>
            <Card
              onClick={() => !loading && onSelect(device)}
              selected={isSelected}
              className={cn(loading && "pointer-events-none opacity-60")}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                    {device.name ?? "Unnamed Device"}
                  </p>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                    ID: {device.id}
                  </p>
                </div>
                <span className="shrink-0 text-primary">
                  {loading && isSelected ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  )}
                </span>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
