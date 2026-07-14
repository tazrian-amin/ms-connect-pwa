"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useBluetooth } from "@/context/bluetooth-provider";

export function SamplePeriodControl() {
  const { samplePeriodMs, setSamplePeriodSeconds } = useBluetooth();
  const [seconds, setSeconds] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentSeconds = samplePeriodMs !== null ? samplePeriodMs / 1000 : null;

  const handleSubmit = async () => {
    const value = parseInt(seconds, 10);
    if (isNaN(value) || value <= 0) {
      setStatus("Enter a valid number of seconds");
      return;
    }

    setSubmitting(true);
    setStatus("Sending...");
    try {
      await setSamplePeriodSeconds(value);
      setStatus(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Sample Period
        </Typography>
        {currentSeconds !== null && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Current period: {currentSeconds}s
          </Typography>
        )}
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <TextField
            type="number"
            size="small"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            placeholder="60"
            slotProps={{ htmlInput: { min: 1, max: 86400, step: 1 } }}
            sx={{ flex: 1, minWidth: 120 }}
          />
          <Button variant="contained" onClick={handleSubmit} loading={submitting}>
            Set Period
          </Button>
        </Stack>
        {status && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {status}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
