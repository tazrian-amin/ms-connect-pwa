"use client";

import Box from "@mui/material/Box";
import Radio from "@mui/material/Radio";

import {
  PUMP_DISABLED_OPACITY,
  PUMP_MATRIX_ROW_HEIGHT,
  PumpMonitoringPalette,
} from "./constants";

interface PumpAssignmentRadiosProps {
  /** The column this stack belongs to — the pump whose gauge sits below it. */
  pumpId: number;
  /** Row ids top to bottom; the water column labels the very same list. */
  rowIds: number[];
  /** Row this column currently claims, or null while it claims none. */
  selectedRowId: number | null;
  /**
   * Claiming a row takes it from whichever column held it, so the parent —
   * not this stack — is what keeps a row from being claimed twice.
   */
  onSelect: (pumpId: number, rowId: number) => void;
  /** The pump is switched off: the stack dims and stops taking input. */
  disabled?: boolean;
  /** Read-only dashboard: selection is inert but stays at full contrast. */
  locked?: boolean;
}

/**
 * One pump column's slice of the alteration matrix. The radios are exclusive
 * down the column by construction, and exclusive across the row because the
 * parent moves a claimed row rather than duplicating it.
 */
export function PumpAssignmentRadios({
  pumpId,
  rowIds,
  selectedRowId,
  onSelect,
  disabled = false,
  locked = false,
}: PumpAssignmentRadiosProps) {
  const inert = disabled || locked;

  return (
    <Box
      role="radiogroup"
      aria-label={`Pump ${pumpId} row assignment`}
      sx={{
        display: "flex",
        flexDirection: "column",
        ...(disabled ? { opacity: PUMP_DISABLED_OPACITY } : {}),
      }}
    >
      {rowIds.map((rowId) => (
        <Box
          key={rowId}
          sx={{
            height: PUMP_MATRIX_ROW_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Radio
            size="small"
            checked={selectedRowId === rowId}
            onChange={() => onSelect(pumpId, rowId)}
            // Disabling the input rather than the Radio keeps MUI's greyed-out
            // treatment off the claimed circle. The dashboard opens read-only
            // and the firmware will later drive which row is lit, so the
            // matrix has to stay legible exactly when it can't be touched.
            slotProps={{
              input: {
                disabled: inert,
                "aria-label": `Pump ${pumpId}, row Pump ${rowId}`,
              },
            }}
            sx={{
              p: 0,
              color: PumpMonitoringPalette.radioIdle,
              "&.Mui-checked": { color: PumpMonitoringPalette.radioClaimed },
              ...(inert ? { pointerEvents: "none" } : {}),
            }}
          />
        </Box>
      ))}
    </Box>
  );
}
