"use client";

import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { ProvisionProgress } from "@/context/bluetooth-provider";

// Matches the firmware's EEPROM field sizes (main.cpp: kMaxProductUidLength / kMaxSerialNumLength).
const MAX_FIELD_LENGTH = 127;

const PROGRESS_MESSAGE: Record<ProvisionProgress, string> = {
  sending: "Sending configuration to device...",
  confirming: "Confirming setup over Bluetooth, this can take up to 45 seconds...",
  rebooting: "Device is restarting, this can take up to 2 minutes...",
};

interface DeviceSetupDialogProps {
  open: boolean;
  onSubmit: (
    productUid: string,
    serialNumber: string,
    onProgress: (stage: ProvisionProgress) => void,
  ) => Promise<{ ok: boolean; message?: string }>;
  onDisconnect: () => Promise<void>;
}

export function DeviceSetupDialog({
  open,
  onSubmit,
  onDisconnect,
}: DeviceSetupDialogProps) {
  const [productUid, setProductUid] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProvisionProgress | null>(null);

  const isWorking = progress !== null;

  const handleSubmit = async () => {
    const uid = productUid.trim();
    const sn = serialNumber.trim();

    if (!uid || !sn) {
      setError("Product UID and Serial Number are both required.");
      return;
    }
    if (uid.length > MAX_FIELD_LENGTH || sn.length > MAX_FIELD_LENGTH) {
      setError(`Product UID and Serial Number must be ${MAX_FIELD_LENGTH} characters or fewer.`);
      return;
    }

    setError(null);
    const result = await onSubmit(uid, sn, setProgress);
    setProgress(null);

    if (!result.ok) {
      setError(result.message ?? "Setup failed. Please try again.");
    }
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle>Device Setup Required</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This device hasn&apos;t been configured yet. Enter the Product UID and
          Serial Number to complete first-time setup.
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Product UID"
            size="small"
            fullWidth
            value={productUid}
            onChange={(e) => setProductUid(e.target.value)}
            disabled={isWorking}
            autoFocus
          />
          <TextField
            label="Serial Number"
            size="small"
            fullWidth
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            disabled={isWorking}
          />
        </Stack>

        {isWorking && (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mt: 2 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              {PROGRESS_MESSAGE[progress]}
            </Typography>
          </Stack>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onDisconnect} color="secondary" disabled={isWorking}>
          Disconnect
        </Button>
        <Button onClick={handleSubmit} variant="contained" loading={isWorking}>
          Save &amp; Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
