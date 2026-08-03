"use client";

import { useCallback, useState } from "react";

import { useBluetooth } from "@/context/bluetooth-provider";
import { useToast } from "@/context/toast-provider";
import { replyCarrying } from "./device-settings";

export interface DeviceCommandRequest {
  /**
   * Identifies the control, e.g. `pump-3-enabled`. Only this control shows a
   * spinner, so one pump's slow command never freezes the rest of the row.
   */
  key: string;
  command: Record<string, string>;
  /**
   * Firmware read-back field whose presence in the reply confirms the change,
   * e.g. `pump_3_high_thr`. The value the UI then shows comes from the reply,
   * not from what was asked for.
   */
  confirms: string;
  /** Completes "Could not …" in the failure message, e.g. "disable pump 3". */
  action: string;
}

/**
 * Every write to the device goes through here, so the rule holds in one place:
 * send, wait for the firmware's own confirmation, and only then let the UI
 * move. A command that is rejected or never answered leaves the dashboard
 * showing what the device actually has, and says so.
 */
export function useDeviceCommand() {
  const { sendCommandAndWait } = useBluetooth();
  const { showToast } = useToast();
  const [pendingKeys, setPendingKeys] = useState<readonly string[]>([]);

  const isPending = useCallback(
    (key: string) => pendingKeys.includes(key),
    [pendingKeys],
  );

  const run = useCallback(
    async ({
      key,
      command,
      confirms,
      action,
    }: DeviceCommandRequest): Promise<Record<string, unknown> | null> => {
      setPendingKeys((prev) => (prev.includes(key) ? prev : [...prev, key]));
      try {
        // Flat commands carry exactly one key, which is also the name the
        // firmware puts in a rejection — see replyCarrying.
        const [commandKey] = Object.keys(command);
        const reply = await sendCommandAndWait(
          command,
          replyCarrying(confirms, commandKey),
        );

        if (reply === null) {
          showToast(`Could not ${action} — the device did not respond.`);
          return null;
        }
        if (reply.status === "error") {
          const detail =
            typeof reply.msg === "string" ? reply.msg : "the device rejected it";
          showToast(`Could not ${action} — ${detail}.`);
          return null;
        }
        return reply;
      } finally {
        setPendingKeys((prev) => prev.filter((pending) => pending !== key));
      }
    },
    [sendCommandAndWait, showToast],
  );

  return { isPending, run };
}
