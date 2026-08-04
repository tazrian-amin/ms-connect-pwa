"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import {
  COLUMN_TITLE_HEIGHT,
  PUMP_TOGGLE_HEIGHT,
  PumpMonitoringPalette,
  STATUS_INDICATOR_HEIGHT,
  STATUS_INDICATOR_MAX_WIDTH,
} from "./constants";
import {
  PUMP_RUN_STATE_LABELS,
  PUMP_RUN_STATE_TEXT_COLORS,
} from "./pump-run-state";
import type { ColumnStatus, PumpRunState, PumpStatus } from "./types";

/** One column's worth of what the three header rows need to say about it. */
export interface PumpColumnView {
  column: ColumnStatus;
  /** Null for a column no pump is bound to — the alteration-mode T.B.D. case. */
  pump: PumpStatus | null;
  /** Null alongside a null pump: no pump, no state. */
  runState: PumpRunState | null;
}

interface PumpHeaderRowsProps {
  views: PumpColumnView[];
  onEnabledChange: (pumpId: number, enabled: boolean) => void;
  /** Read-only dashboard: the switches are inert, the rest reads as normal. */
  locked: boolean;
  /** Whether that pump's enable command is still out with the device. */
  isEnablePending: (pumpId: number) => boolean;
}

/** Shown wherever a figure belongs to a pump and no pump is bound yet. */
const UNBOUND_LABEL = "—";

/**
 * The row's name, in the grid's first column — the same column the water level
 * gauge sits in underneath. Centered on that column, the way every pump cell is
 * centered on its own, so the three read as one stack.
 */
function RowLabel({ children, height }: { children: ReactNode; height: number }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height,
      }}
    >
      <Typography
        sx={{
          color: PumpMonitoringPalette.text,
          fontSize: 15,
          fontWeight: 700,
          whiteSpace: "nowrap",
          lineHeight: 1.2,
        }}
      >
        {children}
      </Typography>
    </Box>
  );
}

/** One cell of a header row, centered over its pump's gauge below. */
function HeaderCell({ children, height }: { children: ReactNode; height: number }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * Whether the pump takes part in the control loop. The row's label says what
 * the switches are, so each one carries no word of its own — its position is
 * the state, and it keeps an accessible name naming the pump it belongs to.
 *
 * The switch tracks the device, not the press: while the command is out it
 * holds its position and shows a spinner beside it, and only the device's
 * answer moves it.
 */
function EnableSwitch({
  pump,
  columnNumber,
  locked,
  pending,
  onEnabledChange,
}: {
  pump: PumpStatus | null;
  columnNumber: number;
  locked: boolean;
  pending: boolean;
  onEnabledChange: (pumpId: number, enabled: boolean) => void;
}) {
  return (
    <Stack direction="row" spacing={0.25} sx={{ alignItems: "center" }}>
      <Switch
        size="small"
        checked={pump?.enabled ?? false}
        disabled={locked || pending || pump === null}
        onChange={(event) => {
          if (pump) onEnabledChange(pump.id, event.target.checked);
        }}
        slotProps={{
          input: {
            "aria-label": pump
              ? `Enable pump ${pump.id}`
              : `Column ${columnNumber} has no pump assigned`,
          },
        }}
      />
      {/* Reserved either way, so the switch doesn't shift as commands come
          and go. */}
      <Box
        sx={{
          width: 12,
          display: "flex",
          alignItems: "center",
          color: PumpMonitoringPalette.textMuted,
        }}
      >
        {pending && <CircularProgress size={11} color="inherit" />}
      </Box>
    </Stack>
  );
}

/**
 * Which pump is answering this column's levels. Under alteration the device
 * decides that, and only once the role is actually called on — until then the
 * column is a role with no pump, and says so.
 */
function PumpTitle({ pump }: { pump: PumpStatus | null }) {
  return (
    <Typography
      sx={{
        color:
          pump === null || !pump.enabled
            ? PumpMonitoringPalette.textMuted
            : PumpMonitoringPalette.text,
        fontSize: 16,
        fontWeight: 600,
        lineHeight: `${COLUMN_TITLE_HEIGHT}px`,
      }}
    >
      {pump ? `#${pump.id}` : "T.B.D."}
    </Typography>
  );
}

/**
 * Single pill carrying what the pump is doing, as a word — see PumpRunState for
 * the four it can be. The word is the whole indicator, so its colour is what
 * separates the four at a glance. An unbound column has no pump to have a state
 * at all, and shows the same dash its counters do.
 */
function StatusIndicator({ runState }: { runState: PumpRunState | null }) {
  return (
    <Box
      role="status"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        maxWidth: STATUS_INDICATOR_MAX_WIDTH,
        height: STATUS_INDICATOR_HEIGHT,
        bgcolor: PumpMonitoringPalette.columnBg,
        border: `1px solid ${PumpMonitoringPalette.borderMuted}`,
        borderRadius: "12px",
        px: 1,
      }}
    >
      <Typography
        sx={{
          color:
            runState === null
              ? PumpMonitoringPalette.textMuted
              : PUMP_RUN_STATE_TEXT_COLORS[runState],
          fontSize: 14,
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {runState === null ? UNBOUND_LABEL : PUMP_RUN_STATE_LABELS[runState]}
      </Typography>
    </Box>
  );
}

/**
 * The three rows heading the dashboard grid: each pump's enable switch, its
 * number, and what it is doing. Rendered as bare grid cells — a fragment, not
 * a wrapper — so they share the parent grid's columns with the gauges
 * underneath and every cell stays over its own pump.
 */
export function PumpHeaderRows({
  views,
  onEnabledChange,
  locked,
  isEnablePending,
}: PumpHeaderRowsProps) {
  return (
    <>
      <RowLabel height={PUMP_TOGGLE_HEIGHT}>Enable/Disable</RowLabel>
      {views.map(({ column, pump }) => (
        <HeaderCell key={column.number} height={PUMP_TOGGLE_HEIGHT}>
          <EnableSwitch
            pump={pump}
            columnNumber={column.number}
            locked={locked}
            pending={pump !== null && isEnablePending(pump.id)}
            onEnabledChange={onEnabledChange}
          />
        </HeaderCell>
      ))}

      <RowLabel height={COLUMN_TITLE_HEIGHT}>Pumps</RowLabel>
      {views.map(({ column, pump }) => (
        <HeaderCell key={column.number} height={COLUMN_TITLE_HEIGHT}>
          <PumpTitle pump={pump} />
        </HeaderCell>
      ))}

      <RowLabel height={STATUS_INDICATOR_HEIGHT}>Status</RowLabel>
      {views.map(({ column, runState }) => (
        <HeaderCell key={column.number} height={STATUS_INDICATOR_HEIGHT}>
          <StatusIndicator runState={runState} />
        </HeaderCell>
      ))}
    </>
  );
}
