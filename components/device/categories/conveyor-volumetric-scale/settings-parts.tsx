"use client";

import { useEffect, useState } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";

import { ScalePalette } from "./constants";

/**
 * idle → applying (sent, awaiting the write) → applied (held briefly) → idle.
 * A write that fails drops straight back to idle so the press can be retried.
 */
export type ApplyState = "idle" | "applying" | "applied";

/** How long the confirmation stays up before the button goes quiet again. */
const APPLIED_LABEL_MS = 1800;

/**
 * Runs `send` behind the Apply button's states, dropping the "Applied"
 * confirmation on its own once it has been up long enough to read.
 */
export function useApplyState() {
  const [applyState, setApplyState] = useState<ApplyState>("idle");

  useEffect(() => {
    if (applyState !== "applied") return;
    const timer = setTimeout(() => setApplyState("idle"), APPLIED_LABEL_MS);
    return () => clearTimeout(timer);
  }, [applyState]);

  const run = async (send: () => Promise<boolean>) => {
    setApplyState("applying");
    setApplyState((await send()) ? "applied" : "idle");
  };

  return { applyState, isApplying: applyState === "applying", run };
}

/** The card every dashboard settings section sits in, with its heading. */
export function SettingsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        mb: 2,
        bgcolor: ScalePalette.panelBg,
        border: `1px solid ${ScalePalette.border}`,
        borderRadius: "20px",
        px: 2,
        py: 1.75,
      }}
    >
      <Typography sx={{ color: ScalePalette.text, fontSize: 16, fontWeight: 600 }}>{title}</Typography>
      <Typography sx={{ color: ScalePalette.textMuted, fontSize: 13, lineHeight: "20px" }}>{description}</Typography>
      {children}
    </Box>
  );
}

/** A titled cluster of fields, so unrelated settings read as separate things. */
export function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        border: `1px solid ${ScalePalette.borderMuted}`,
        borderRadius: "14px",
        px: 1.5,
        py: 1.25,
        minWidth: 0,
      }}
    >
      <Typography
        sx={{
          color: ScalePalette.text,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 2 }}>{children}</Box>
    </Box>
  );
}

export function FieldBlock({
  label,
  grow = false,
  children,
}: {
  label: string;
  /** Fill the group's row rather than sizing to the control. */
  grow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        minWidth: 0,
        flex: grow ? "1 1 240px" : "0 0 auto",
      }}
    >
      <Typography sx={{ color: ScalePalette.textMuted, fontSize: 13, fontWeight: 600 }}>{label}</Typography>
      {children}
    </Box>
  );
}

/** Right-aligned Apply button that spells out the apply state. */
export function ApplyButton({
  applyState,
  disabled,
  onClick,
}: {
  applyState: ApplyState;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
      <Button
        size="small"
        disabled={disabled}
        onClick={onClick}
        startIcon={
          applyState === "applying" ? (
            <CircularProgress size={14} color="inherit" />
          ) : applyState === "applied" ? (
            <CheckRoundedIcon sx={{ fontSize: 18 }} />
          ) : undefined
        }
        sx={{
          // Held steady across "Apply" / "Applying" / "Applied" so the row
          // doesn't shift under the pointer mid-press.
          minWidth: 124,
          height: 40,
          px: 2.5,
          borderRadius: "10px",
          bgcolor: ScalePalette.buttonBg,
          border: `1px solid ${ScalePalette.borderMuted}`,
          color: ScalePalette.buttonText,
          fontSize: 14,
          fontWeight: 600,
          textTransform: "none",
          "&:hover": { bgcolor: ScalePalette.buttonBg },
          // The confirmation has to stay legible while the button sits
          // disabled, which is exactly when MUI dims it.
          "&.Mui-disabled": {
            ...(applyState === "applied" ? { color: ScalePalette.greenActive } : {}),
          },
        }}
      >
        {applyState === "applying" ? "Applying" : applyState === "applied" ? "Applied" : "Apply"}
      </Button>
    </Box>
  );
}

/** Rounded, panel-tinted chrome shared by the sections' inputs and selects. */
export const settingsInputSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: ScalePalette.rowBg },
} as const;
