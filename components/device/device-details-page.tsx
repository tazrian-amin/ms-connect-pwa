"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DeviceInfo, DeviceDataPanel } from "@/components/device/device-info";
import { TelemetryChart } from "@/components/device/telemetry-chart";
import { SamplePeriodControl } from "@/components/device/sample-period-control";
import { CommandConsole } from "@/components/device/command-console";
import { useBluetooth } from "@/context/bluetooth-provider";

export function DeviceDetailsPage() {
  const params = useParams<{ deviceId: string }>();
  const router = useRouter();
  const { connectedDevice, readings, adcSamples, disconnect, status } =
    useBluetooth();

  const deviceId = params.deviceId;
  const isCurrentDevice = connectedDevice?.id === deviceId;

  useEffect(() => {
    if (!connectedDevice && status !== "connecting") {
      router.replace("/");
    }
  }, [connectedDevice, status, router]);

  if (!isCurrentDevice || !connectedDevice) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-zinc-500 dark:text-zinc-400">
          {status === "connecting" ? "Connecting to device..." : "Device not found."}
        </p>
        {status !== "connecting" && (
          <Link href="/" className="mt-4">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-2 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {connectedDevice.name}
          </h1>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            await disconnect();
            router.push("/");
          }}
        >
          Disconnect
        </Button>
      </div>

      <div className="space-y-4">
        <DeviceInfo device={connectedDevice} />
        <TelemetryChart samples={adcSamples} />
        {readings.length > 0 && <DeviceDataPanel readings={readings} />}
        <SamplePeriodControl />
        <CommandConsole />
      </div>
    </div>
  );
}
