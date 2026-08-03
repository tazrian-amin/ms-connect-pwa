"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

import type { SessionCounter } from "./types";

interface ResetCounterDialogProps {
  open: boolean;
  /** Null while closed; drives the pump named in the prompt. */
  pumpId: number | null;
  /** Which of the pump's two session counters is being cleared. */
  counter: SessionCounter;
  /**
   * Preformatted value about to be cleared — "2d 4h 23m" for the runtime, "12"
   * for the starts.
   */
  valueLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /**
   * The reset is with the device. It only counts once the device answers with
   * the zeroed counter, so the dialog stays up — and shut — until then.
   */
  pending?: boolean;
}

/** Guards a counter reset, which is destructive and has no undo. */
export function ResetCounterDialog({
  open,
  pumpId,
  counter,
  valueLabel,
  onConfirm,
  onCancel,
  pending = false,
}: ResetCounterDialogProps) {
  const isRuntime = counter === "runtime";
  const counterName = isRuntime ? "session runtime" : "session starts";

  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      onClose={pending ? undefined : onCancel}
    >
      <DialogTitle>
        Reset pump {pumpId} {counterName}?
      </DialogTitle>
      <DialogContent>
        {/* Each counter is cleared on its own, so only the one being reset is
            named — the other session figure keeps running. */}
        <Typography variant="body2" color="text.secondary">
          This clears the {isRuntime ? "session runtime of" : "session start count of"}{" "}
          <Typography
            component="span"
            variant="body2"
            color="text.primary"
            sx={{ fontWeight: 600 }}
          >
            {valueLabel}
          </Typography>{" "}
          back to zero, and can&apos;t be undone.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          The {isRuntime ? "total runtime" : "total starts"} since installation
          is not affected, and neither is this pump&apos;s{" "}
          {isRuntime ? "session start count" : "session runtime"}. Note that
          alteration ranks on the session counters, so this can also move this
          pump to the front of the running order.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="secondary" disabled={pending}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          loading={pending}
          autoFocus
        >
          Reset
        </Button>
      </DialogActions>
    </Dialog>
  );
}
