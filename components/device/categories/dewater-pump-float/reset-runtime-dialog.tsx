"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";

interface ResetRuntimeDialogProps {
  open: boolean;
  /** Null while closed; drives the pump named in the prompt. */
  pumpId: number | null;
  /** Preformatted current runtime about to be cleared, e.g. "2d 4h 23m". */
  currentRuntimeLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Guards the runtime reset, which is destructive and has no undo. */
export function ResetRuntimeDialog({
  open,
  pumpId,
  currentRuntimeLabel,
  onConfirm,
  onCancel,
}: ResetRuntimeDialogProps) {
  return (
    <Dialog open={open} maxWidth="xs" fullWidth onClose={onCancel}>
      <DialogTitle>Reset pump {pumpId} runtime?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          This clears the current runtime of{" "}
          <Typography component="span" variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
            {currentRuntimeLabel}
          </Typography>{" "}
          back to zero. It can&apos;t be undone.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          The total runtime since installation is not affected.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="secondary">
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" autoFocus>
          Reset
        </Button>
      </DialogActions>
    </Dialog>
  );
}
