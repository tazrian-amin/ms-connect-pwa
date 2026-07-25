"use client";

import { useCallback, useState } from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DeviceInfo } from "@/components/device/device-info";
import { TelemetryChart } from "@/components/device/telemetry-chart";
import { SamplePeriodControl } from "@/components/device/sample-period-control";
import { CommandConsole } from "@/components/device/command-console";
import { useBluetooth } from "@/context/bluetooth-provider";
import type { ProvisionProgress } from "@/context/bluetooth-provider";
import type { CategoryDetailsProps } from "@/components/device/categories";
import { PumpMonitoringDashboard } from "./pump-monitoring-dashboard";
import { DeviceSetupDialog } from "./device-setup-dialog";

export function DewaterPumpFloatDetails({ isConnected }: CategoryDetailsProps) {
  const {
    connectedDevice,
    readings,
    waterLevelSamples,
    deviceProductUid,
    deviceSerialNumber,
    provisionDevice,
    updateDeviceIdentity,
    disconnect,
  } = useBluetooth();
  const samples = isConnected ? waterLevelSamples : [];
  const [editOpen, setEditOpen] = useState(false);

  const needsSetup =
    isConnected && (deviceProductUid === "" || deviceSerialNumber === "");

  // Manual edit of an already-provisioned device. Writes the new identity, then
  // keeps the dialog loader up across the firmware's reboot + auto-reconnect
  // until get_config confirms the new values (see updateDeviceIdentity). Skips
  // the reboot entirely when nothing actually changed.
  const handleEditSave = useCallback(
    (uid: string, sn: string, onProgress?: (stage: ProvisionProgress) => void) => {
      if (uid === (deviceProductUid ?? "") && sn === (deviceSerialNumber ?? "")) {
        return Promise.resolve({ ok: true as const });
      }
      return updateDeviceIdentity(uid, sn, onProgress);
    },
    [deviceProductUid, deviceSerialNumber, updateDeviceIdentity],
  );

  return (
    <Stack spacing={2}>
      {isConnected && connectedDevice && (
        <DeviceInfo
          device={connectedDevice}
          readings={readings}
          onEditSettings={() => setEditOpen(true)}
        />
      )}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Pump Monitoring
          </Typography>
          <PumpMonitoringDashboard />
        </CardContent>
      </Card>
      <TelemetryChart
        samples={samples}
        title="Water Level Telemetry"
        seriesLabel="Water Level"
        unit="%"
        yDomain={[0, 100]}
        emptyMessage="Waiting for water level readings from the device..."
      />
      <SamplePeriodControl />
      <CommandConsole categoryId="dewater-pump-float" />
      <DeviceSetupDialog
        open={needsSetup}
        onSubmit={provisionDevice}
        onDisconnect={disconnect}
      />
      <DeviceSetupDialog
        open={editOpen}
        mode="edit"
        initialProductUid={deviceProductUid ?? ""}
        initialSerialNumber={deviceSerialNumber ?? ""}
        onSubmit={handleEditSave}
        onDisconnect={disconnect}
        onClose={() => setEditOpen(false)}
      />
    </Stack>
  );
}
