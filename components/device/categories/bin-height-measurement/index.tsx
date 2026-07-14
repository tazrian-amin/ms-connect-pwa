"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DeviceInfo } from "@/components/device/device-info";
import { IndustrialBinHopper } from "@/components/device/categories/bin-height-measurement/industrial-bin-hopper";
import { TelemetryChart } from "@/components/device/telemetry-chart";
import { SamplePeriodControl } from "@/components/device/sample-period-control";
import { CommandConsole } from "@/components/device/command-console";
import { useBluetooth } from "@/context/bluetooth-provider";
import type { CategoryDetailsProps } from "@/components/device/categories";

// 12-bit ADC range for the bin height sensor; no real capacity/tons
// calibration exists yet, so load is reported in raw ADC counts.
const MAX_ADC = 4095;

export function BinHeightMeasurementDetails({ isConnected }: CategoryDetailsProps) {
  const { connectedDevice, readings, adcSamples } = useBluetooth();
  const samples = isConnected ? adcSamples : [];

  const latestAdc =
    samples.length > 0 ? samples[samples.length - 1].value : null;
  const fillLevel =
    latestAdc == null
      ? 0
      : Math.min(100, Math.max(0, (latestAdc / MAX_ADC) * 100));

  return (
    <Stack spacing={2}>
      {isConnected && connectedDevice && (
        <DeviceInfo device={connectedDevice} readings={readings} />
      )}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" component="h2" gutterBottom>
            Current Material Height
          </Typography>
          <IndustrialBinHopper
            fillLevel={fillLevel}
            capacity={MAX_ADC}
            loadUnitLabel="ADC counts"
          />
          <Typography variant="h5" sx={{ mt: 1, textAlign: "center", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {latestAdc == null ? "—" : latestAdc}
          </Typography>
        </CardContent>
      </Card>
      <TelemetryChart samples={samples} />
      <SamplePeriodControl />
      <CommandConsole categoryId="bin-height-measurement" />
    </Stack>
  );
}
