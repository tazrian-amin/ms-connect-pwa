"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useBluetooth } from "@/context/bluetooth-provider";

export function SamplePeriodControl() {
  const { samplePeriodMs, setSamplePeriodSeconds } = useBluetooth();
  const [seconds, setSeconds] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentSeconds =
    samplePeriodMs !== null ? samplePeriodMs / 1000 : null;

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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Sample Period
      </h2>
      {currentSeconds !== null && (
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Current period: {currentSeconds}s
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min={1}
          max={86400}
          step={1}
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
          placeholder="60"
          className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <Button onClick={handleSubmit} loading={submitting}>
          Set Period
        </Button>
      </div>
      {status && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {status}
        </p>
      )}
    </Card>
  );
}
