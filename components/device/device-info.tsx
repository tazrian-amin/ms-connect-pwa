"use client";

import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import SettingsIcon from "@mui/icons-material/Settings";
import type { ConnectedDevice, DeviceReading } from "@/types/bluetooth";
import { getCategoryById } from "@/lib/bluetooth/categories";

interface DeviceInfoProps {
  device: ConnectedDevice;
  readings: DeviceReading[];
  onEditSettings?: () => void;
}

export function DeviceInfo({ device, readings, onEditSettings }: DeviceInfoProps) {
  const category = getCategoryById(device.categoryId);
  const productUid = readings.find((r) => r.id === "product_uid")?.value ?? "—";
  const serialNumber = readings.find((r) => r.id === "serial_number")?.value ?? "—";

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            {category && <Avatar variant="rounded" src={category.image} sx={{ width: 40, height: 40 }} />}
            <Typography variant="h6" component="h2">
              Device Information
            </Typography>
          </Stack>
          {onEditSettings && (
            <Tooltip title="Edit device settings">
              <IconButton
                aria-label="Edit device settings"
                onClick={onEditSettings}
                size="small"
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        <Stack spacing={1.5}>
          <InfoRow label="Name" value={device.name} />
          <InfoRow
            label="Category"
            value={category ? `${category.icon} ${category.name}` : device.categoryId}
          />
          <InfoRow label="Product UID" value={productUid} />
          <InfoRow label="Serial Number" value={serialNumber} />
          <InfoRow label="Device ID" value={device.id} />
          <InfoRow label="Connected" value={device.connectedAt.toLocaleString()} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ justifyContent: "space-between" }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}
