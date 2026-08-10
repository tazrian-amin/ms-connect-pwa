"use client";

import { DeviceInfo } from "@/components/device/device-info";
// import { TelemetryChart } from "@/components/device/telemetry-chart";
// import { SamplePeriodControl } from "@/components/device/sample-period-control";
// import { CommandConsole } from "@/components/device/command-console";
import { useBluetooth } from "@/context/bluetooth-provider";
import type { CategoryDetailsProps } from "@/components/device/categories";
import { Card, CardContent, Typography } from "@mui/material";
import { ScaleMonitoringDashboard } from "../conveyor-volumetric-scale/scale-monitoring-dashboard";

export function ConveyorVolumetricScaleProDetails({
  isConnected,
}: CategoryDetailsProps) {
  const {
    connectedDevice,
    readings,
    // adcSamples
  } = useBluetooth();
  // const samples = isConnected ? adcSamples : [];

  return (
    <div className="space-y-4">
      {isConnected && connectedDevice && (
        <DeviceInfo device={connectedDevice} readings={readings} />
      )}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Scale Monitoring
          </Typography>
          <ScaleMonitoringDashboard />
        </CardContent>
      </Card>
      {/* <CommandConsole categoryId="conveyor-volumetric-scale-pro" /> */}
    </div>
  );
}
