"use client";

import Image from "next/image";
import type { ConnectedDevice, DeviceReading } from "@/types/bluetooth";
import { getCategoryById } from "@/lib/bluetooth/categories";
import { Card } from "@/components/ui/card";

interface DeviceInfoProps {
  device: ConnectedDevice;
}

export function DeviceInfo({ device }: DeviceInfoProps) {
  const category = getCategoryById(device.categoryId);

  return (
    <Card>
      <div className="mb-4 flex items-center gap-3">
        {category && (
          <Image
            src={category.image}
            alt=""
            width={40}
            height={40}
            className="shrink-0 rounded-lg"
            aria-hidden="true"
          />
        )}
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Device Information
        </h2>
      </div>
      <dl className="space-y-3">
        <InfoRow label="Name" value={device.name} />
        <InfoRow label="Device ID" value={device.id} />
        <InfoRow
          label="Category"
          value={category ? `${category.icon} ${category.name}` : device.categoryId}
        />
        <InfoRow
          label="Connected"
          value={device.connectedAt.toLocaleString()}
        />
        <InfoRow
          label="Status"
          value={device.server.connected ? "Connected" : "Disconnected"}
          valueClassName={
            device.server.connected ? "text-green-600 dark:text-green-400" : "text-red-600"
          }
        />
      </dl>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd
        className={`text-sm font-medium text-zinc-900 dark:text-zinc-50 ${valueClassName ?? ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

interface DeviceDataPanelProps {
  readings: DeviceReading[];
}

export function DeviceDataPanel({ readings }: DeviceDataPanelProps) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Live Data
      </h2>

      {readings.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Waiting for data from the device. Make sure the device is sending
          notifications on supported characteristics.
        </p>
      ) : (
        <ul className="space-y-3" role="list">
          {readings.map((reading) => (
            <li
              key={reading.id}
              className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800"
            >
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {reading.label}
              </span>
              <div className="text-right">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {reading.value}
                </p>
                <p className="text-xs text-zinc-400">
                  {reading.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
