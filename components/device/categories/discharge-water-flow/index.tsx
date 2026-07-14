"use client";

import { DeviceInfo } from "@/components/device/device-info";
import { TelemetryChart } from "@/components/device/telemetry-chart";
import { SamplePeriodControl } from "@/components/device/sample-period-control";
import { CommandConsole } from "@/components/device/command-console";
import { useBluetooth } from "@/context/bluetooth-provider";
import type { CategoryDetailsProps } from "@/components/device/categories";

export function DischargeWaterFlowDetails({ isConnected }: CategoryDetailsProps) {
  const { connectedDevice, readings, adcSamples } = useBluetooth();

  return (
    <div className="space-y-4">
      {isConnected && connectedDevice && (
        <DeviceInfo device={connectedDevice} readings={readings} />
      )}
      <TelemetryChart samples={adcSamples} />
      <SamplePeriodControl />
      <CommandConsole />
    </div>
  );
}
