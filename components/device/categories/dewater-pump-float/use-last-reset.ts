"use client";

import { useCallback, useEffect, useState } from "react";

import type { SessionCounter } from "./types";

/**
 * When each session counter was last cleared, as this browser saw it.
 *
 * Unlike everything else on the dashboard, this is *not* the device's to own —
 * the firmware reports no reset timestamp, and the controller has no clock the
 * dashboard could read one off. The only thing that knows when the operator
 * pressed Reset is the phone they pressed it on, so that is what this keeps: a
 * local note, written once the device has confirmed the reset.
 *
 * Which makes it a record of *this* browser's resets. A reset done from another
 * phone leaves no mark here, and clearing site data loses it — the caption
 * above each button says as much rather than implying the device remembers.
 */
export interface LastResetTimes {
  /** Epoch ms of the last session-runtime reset, or null if none is recorded. */
  runtime: number | null;
  starts: number | null;
}

const NONE: LastResetTimes = { runtime: null, starts: null };

// Keyed by controller: one phone commissions several, and the date of a reset
// on one says nothing about any other.
const STORAGE_PREFIX = "ms-connect:pump-last-reset:";

function storageKey(deviceSerial: string): string {
  return `${STORAGE_PREFIX}${deviceSerial}`;
}

function epochOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

// Every access is guarded: localStorage throws outright in some private modes,
// and the stored value is only ever a hint — a dashboard that can't read it
// should show no date, never fail to render.
function readStored(deviceSerial: string): LastResetTimes {
  try {
    const raw = window.localStorage.getItem(storageKey(deviceSerial));
    if (raw === null) return NONE;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return NONE;
    const record = parsed as Record<string, unknown>;
    return {
      runtime: epochOrNull(record.runtime),
      starts: epochOrNull(record.starts),
    };
  } catch {
    return NONE;
  }
}

function writeStored(deviceSerial: string, times: LastResetTimes): void {
  try {
    window.localStorage.setItem(storageKey(deviceSerial), JSON.stringify(times));
  } catch {
    // Nothing to do and nothing worth saying: the reset itself landed, and
    // only the note about when it did is lost.
  }
}

/** Date and time a reset is shown as, in the reader's own locale. */
const RESET_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function formatResetTime(epochMs: number): string {
  return RESET_TIME_FORMAT.format(new Date(epochMs));
}

/**
 * `deviceSerial` is null until the connected controller reports its own, and
 * while none is connected. Nothing is read or written under a controller that
 * hasn't identified itself — a date filed against the wrong pump station is
 * worse than no date at all.
 */
export function useLastReset(deviceSerial: string | null) {
  const [lastReset, setLastReset] = useState<LastResetTimes>(NONE);

  // Read after mount, never during render: there is no localStorage on the
  // server, so a date read during the first client render would not match the
  // markup React is hydrating against.
  useEffect(() => {
    setLastReset(deviceSerial === null ? NONE : readStored(deviceSerial));
  }, [deviceSerial]);

  const markReset = useCallback(
    (counter: SessionCounter) => {
      const next = { ...lastReset, [counter]: Date.now() };
      setLastReset(next);
      if (deviceSerial !== null) writeStored(deviceSerial, next);
    },
    [deviceSerial, lastReset],
  );

  return { lastReset, markReset };
}
