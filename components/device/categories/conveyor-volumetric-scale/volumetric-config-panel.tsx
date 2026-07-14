"use client";

import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useBluetooth } from "@/context/bluetooth-provider";
import { volumetricCommands } from "@/lib/bluetooth/commands";

const TOF_SENSOR_COUNT_OPTIONS = ["1", "2", "3", "4", "5"];

const TOF_RESOLUTION_OPTIONS = [
  { value: "4", label: "4 × 4 zones" },
  { value: "8", label: "8 × 8 zones" },
];

function ConfigRow({
  label,
  helper,
  helperColor = "text.secondary",
  sendDisabled,
  onSend,
  children,
}: {
  label: string;
  helper?: string;
  helperColor?: string;
  sendDisabled: boolean;
  onSend: () => void;
  children: ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 0.75 }}>
      <Typography variant="body2">{label}</Typography>
      <Stack direction="row" spacing={1}>
        {children}
        <Button
          variant="outlined"
          size="small"
          disabled={sendDisabled}
          onClick={onSend}
          sx={{ flexShrink: 0 }}
        >
          Send
        </Button>
      </Stack>
      {helper && (
        <Typography variant="caption" sx={{ color: helperColor }}>
          {helper}
        </Typography>
      )}
    </Box>
  );
}

function parseIntInRange(raw: string, min: number, max?: number): number | null {
  const value = Number(raw.trim());
  if (!Number.isInteger(value) || value < min) return null;
  if (max != null && value > max) return null;
  return value;
}

/**
 * Write-only device configuration for the VOLUMETRIC command family. The
 * firmware has no echo queries; it confirms each write with a config_ack.qo
 * note (and reports identity via device.qo at startup), so fields here start
 * from defaults rather than the device's current values.
 */
export function VolumetricConfigPanel() {
  const { status, sendCommand } = useBluetooth();
  const isConnected = status === "connected";

  const [productUid, setProductUid] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [tofSensorCount, setTofSensorCount] = useState("1");
  const [tofResolution, setTofResolution] = useState("4");
  const [cloudIntervalMinutes, setCloudIntervalMinutes] = useState("5");
  const [samplesToAverage, setSamplesToAverage] = useState("10");
  const [feedback, setFeedback] = useState<string | null>(null);

  const submit = (command: Record<string, unknown>) => {
    void sendCommand(command);
    setFeedback(`Sent ${JSON.stringify(command)}`);
  };

  const sendProductUid = () => {
    const value = productUid.trim();
    if (!value || value.length > 63) {
      setFeedback("Product UID must be 1–63 characters.");
      return;
    }
    submit(volumetricCommands.setProductUid(value));
  };

  const sendDeviceModel = () => {
    const value = deviceModel.trim();
    if (!value || value.length > 31) {
      setFeedback("Device model must be 1–31 characters.");
      return;
    }
    submit(volumetricCommands.setDeviceModel(value));
  };

  const sendSerialNumber = () => {
    const value = serialNumber.trim();
    if (!value || value.length > 31) {
      setFeedback("Serial number must be 1–31 characters.");
      return;
    }
    submit(volumetricCommands.setSerialNumber(value));
  };

  const sendCloudInterval = () => {
    const minutes = parseIntInRange(cloudIntervalMinutes, 1);
    if (minutes === null) {
      setFeedback("Cloud interval must be a positive whole number of minutes.");
      return;
    }
    submit(volumetricCommands.setCloudIntervalMinutes(minutes));
  };

  const sendSamplesToAverage = () => {
    const samples = parseIntInRange(samplesToAverage, 1);
    if (samples === null) {
      setFeedback("Samples to average must be a positive whole number.");
      return;
    }
    submit(volumetricCommands.setSamplesToAverage(samples));
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Device Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Values are not read back from the device — sending overwrites the
          device&apos;s stored setting. Each write is confirmed by a
          config_ack.qo reply.
        </Typography>
        {!isConnected && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Connect to a device to send configuration commands.
          </Typography>
        )}

        <Stack spacing={0.5}>
          <ConfigRow
            label="Product UID"
            helper="Critical: a wrong value takes the device offline."
            helperColor="warning.main"
            sendDisabled={!isConnected}
            onSend={sendProductUid}
          >
            <TextField
              size="small"
              fullWidth
              value={productUid}
              onChange={(event) => setProductUid(event.target.value)}
              placeholder="com.company.project:product"
            />
          </ConfigRow>

          <ConfigRow
            label="ToF Sensor Count"
            helper="Re-initializes sensor hardware on change."
            sendDisabled={!isConnected}
            onSend={() =>
              submit(volumetricCommands.setTofSensorCount(Number(tofSensorCount)))
            }
          >
            <Select
              size="small"
              fullWidth
              value={tofSensorCount}
              onChange={(event) => setTofSensorCount(event.target.value)}
            >
              {TOF_SENSOR_COUNT_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </ConfigRow>

          <ConfigRow
            label="ToF Resolution"
            helper="Re-initializes sensor hardware on change."
            sendDisabled={!isConnected}
            onSend={() =>
              submit(
                volumetricCommands.setTofResolution(
                  Number(tofResolution) as 4 | 8,
                ),
              )
            }
          >
            <Select
              size="small"
              fullWidth
              value={tofResolution}
              onChange={(event) => setTofResolution(event.target.value)}
            >
              {TOF_RESOLUTION_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </ConfigRow>

          <ConfigRow
            label="Cloud Interval (minutes)"
            helper="How often data.qo volumetric averages are published."
            sendDisabled={!isConnected}
            onSend={sendCloudInterval}
          >
            <TextField
              size="small"
              fullWidth
              value={cloudIntervalMinutes}
              onChange={(event) => setCloudIntervalMinutes(event.target.value)}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
            />
          </ConfigRow>

          <ConfigRow
            label="Samples to Average"
            helper="Frames averaged into each logged reading. Tuning only, no hardware re-init."
            sendDisabled={!isConnected}
            onSend={sendSamplesToAverage}
          >
            <TextField
              size="small"
              fullWidth
              value={samplesToAverage}
              onChange={(event) => setSamplesToAverage(event.target.value)}
              slotProps={{ htmlInput: { inputMode: "numeric" } }}
            />
          </ConfigRow>

          <ConfigRow
            label="Device Model"
            sendDisabled={!isConnected}
            onSend={sendDeviceModel}
          >
            <TextField
              size="small"
              fullWidth
              value={deviceModel}
              onChange={(event) => setDeviceModel(event.target.value)}
              placeholder="MS-Volumetric-54161"
            />
          </ConfigRow>

          <ConfigRow
            label="Serial Number"
            sendDisabled={!isConnected}
            onSend={sendSerialNumber}
          >
            <TextField
              size="small"
              fullWidth
              value={serialNumber}
              onChange={(event) => setSerialNumber(event.target.value)}
              placeholder="SN-001"
            />
          </ConfigRow>
        </Stack>

        {feedback && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {feedback}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
