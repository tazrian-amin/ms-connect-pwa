"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DeviceInfo } from "@/components/device/device-info";
import { TelemetryChart } from "@/components/device/telemetry-chart";
import { SamplePeriodControl } from "@/components/device/sample-period-control";
import { CommandConsole } from "@/components/device/command-console";
import { useBluetooth } from "@/context/bluetooth-provider";
import type { CategoryDetailsProps } from "@/components/device/categories";
import { PumpMonitoringDashboard } from "./pump-monitoring-dashboard";
import { DeviceSetupDialog } from "./device-setup-dialog";

export function DewaterPumpFloatDetails({ isConnected }: CategoryDetailsProps) {
  const {
    connectedDevice,
    readings,
    adcSamples,
    deviceProductUid,
    deviceSerialNumber,
    provisionDevice,
    disconnect,
  } = useBluetooth();
  const samples = isConnected ? adcSamples : [];

  const needsSetup =
    isConnected && (deviceProductUid === "" || deviceSerialNumber === "");

  return (
    <Stack spacing={2}>
      {isConnected && connectedDevice && (
        <DeviceInfo device={connectedDevice} readings={readings} />
      )}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Pump Monitoring
          </Typography>
          <PumpMonitoringDashboard />
        </CardContent>
      </Card>
      <TelemetryChart samples={samples} />
      <SamplePeriodControl />
      <CommandConsole categoryId="dewater-pump-float" />
      <DeviceSetupDialog
        open={needsSetup}
        onSubmit={provisionDevice}
        onDisconnect={disconnect}
      />
    </Stack>
  );
}
