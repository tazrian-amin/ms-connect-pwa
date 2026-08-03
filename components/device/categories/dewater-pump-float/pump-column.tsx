"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { PUMP_DISABLED_OPACITY, PumpMonitoringPalette } from "./constants";
import { PumpLevelGauge } from "./pump-level-gauge";
import type { ColumnStatus, PumpStatus } from "./types";

interface PumpColumnProps {
  /** The column itself — its position and its two trigger levels. */
  column: ColumnStatus;
  /**
   * The pump the device has bound to this column, or null while none is.
   * Null is the alteration-mode "T.B.D." case: the role exists and its levels
   * can be set, but no pump has been put to it yet, so there are no counters
   * to show. Its enable flag and state are the header rows' business.
   */
  pump: PumpStatus | null;
  /**
   * Preformatted lifetime runtime since installation, e.g. "2d 4h 23m".
   * Not resettable.
   */
  totalRuntimeLabel: string;
  /** Preformatted runtime since the last reset, same format. */
  currentRuntimeLabel: string;
  /** Preformatted lifetime start count, e.g. "12". Not resettable. */
  totalStartsLabel: string;
  /** Preformatted start count since the last reset, same as the runtime pair. */
  currentStartsLabel: string;
  /** Clears the session runtime only — the session start count is untouched. */
  onResetRuntime: (pumpId: number) => void;
  /** Clears the session start count only — the session runtime is untouched. */
  onResetStarts: (pumpId: number) => void;
  /** Keyed by column, not pump: the levels belong to the role. */
  onTriggerLevelHighChange: (columnNumber: number, level: number) => void;
  onTriggerLevelLowChange: (columnNumber: number, level: number) => void;
  /**
   * Read-only column: every control is inert, but the readouts and gauge keep
   * reading as normal.
   */
  locked?: boolean;
  /** A threshold change is with the device: the gauge holds still until it answers. */
  thresholdPending?: boolean;
}

/** One labelled figure inside a counter card. */
function CounterRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ width: "100%", textAlign: "center" }}>
      <Typography
        sx={{
          color: PumpMonitoringPalette.textMuted,
          fontSize: 11,
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: PumpMonitoringPalette.text,
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 0.3,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/** Hairline between a card's lifetime figure and its session one. */
function CounterDivider() {
  return (
    <Box
      sx={{
        width: "100%",
        height: "1px",
        bgcolor: PumpMonitoringPalette.borderMuted,
      }}
    />
  );
}

/**
 * One measure of the pump's work — its lifetime figure over its session one.
 * Runtime and starts get a card each rather than being pooled, so each pair
 * reads as the total-and-since-reset pair it is.
 */
function CounterCard({ disabled, children }: { disabled: boolean; children: ReactNode }) {
  return (
    <Stack
      spacing={1}
      sx={{
        alignItems: "center",
        width: "100%",
        bgcolor: PumpMonitoringPalette.columnBg,
        border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
        borderRadius: "14px",
        p: 1.5,
        ...(disabled ? { opacity: PUMP_DISABLED_OPACITY } : {}),
      }}
    >
      {children}
    </Stack>
  );
}

/**
 * Clears the one session counter its card carries. The two are separate
 * figures with a device command each, so each card's Reset stands for its own
 * — pressing the runtime's leaves the start count alone, and the other way
 * round. `counterName` says which, since the word on the button can't.
 */
function ResetButton({
  pump,
  counterName,
  disabled,
  onReset,
}: {
  pump: PumpStatus | null;
  counterName: string;
  disabled: boolean;
  onReset: (pumpId: number) => void;
}) {
  return (
    <Button
      size="small"
      disabled={disabled}
      onClick={() => {
        if (pump) onReset(pump.id);
      }}
      aria-label={
        pump
          ? `Reset ${counterName} for pump ${pump.id}`
          : "No pump assigned to reset"
      }
      sx={{
        mt: 0.5,
        px: 2.5,
        borderRadius: "10px",
        bgcolor: PumpMonitoringPalette.resetButtonBg,
        border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
        color: PumpMonitoringPalette.resetButtonText,
        fontSize: 14,
        fontWeight: 600,
        textTransform: "none",
        "&:hover": { bgcolor: PumpMonitoringPalette.resetButtonBg },
      }}
    >
      Reset
    </Button>
  );
}

/**
 * The body of one pump's column: its trigger-level gauge and its two counter
 * cards. What the pump *is* — its number, its enable switch and its state —
 * is stated once per row above the gauges, in PumpHeaderRows.
 */
export function PumpColumn({
  column,
  pump,
  totalRuntimeLabel,
  currentRuntimeLabel,
  totalStartsLabel,
  currentStartsLabel,
  onResetRuntime,
  onResetStarts,
  onTriggerLevelHighChange,
  onTriggerLevelLowChange,
  locked = false,
  thresholdPending = false,
}: PumpColumnProps) {
  const unbound = pump === null;
  // Switched out by its enable flag — the pump exists, the operator has just
  // taken it out of the control loop, so the whole column reads as inactive.
  const pumpDisabled = !unbound && !pump.enabled;
  // An unbound column has no pump to have counters, so those dim as well.
  const countersDimmed = unbound || pumpDisabled;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
      }}
    >
      <PumpLevelGauge
        triggerLevelHigh={column.triggerLevelHigh}
        triggerLevelLow={column.triggerLevelLow}
        onTriggerLevelHighChange={(level) =>
          onTriggerLevelHighChange(column.number, level)
        }
        onTriggerLevelLowChange={(level) =>
          onTriggerLevelLowChange(column.number, level)
        }
        // A disabled pump greys its gauge out with the rest of its column.
        // An *unbound* one does not: the levels are the column's own, and
        // which pump answers them is the device's to decide, so a role no pump
        // has been put to yet still reads and edits as normal.
        disabled={pumpDisabled}
        locked={locked}
        pending={thresholdPending}
      />

      <Stack spacing={1.5} sx={{ mt: 2, width: "100%" }}>
        <CounterCard disabled={countersDimmed}>
          <CounterRow label="Total Runtime" value={totalRuntimeLabel} />
          <CounterDivider />
          <CounterRow label="Session Runtime" value={currentRuntimeLabel} />
          <ResetButton
            pump={pump}
            counterName="session runtime"
            disabled={countersDimmed || locked}
            onReset={onResetRuntime}
          />
        </CounterCard>

        <CounterCard disabled={countersDimmed}>
          <CounterRow label="Total Starts" value={totalStartsLabel} />
          <CounterDivider />
          <CounterRow label="Session Starts" value={currentStartsLabel} />
          <ResetButton
            pump={pump}
            counterName="session starts"
            disabled={countersDimmed || locked}
            onReset={onResetStarts}
          />
        </CounterCard>
      </Stack>
    </Box>
  );
}
