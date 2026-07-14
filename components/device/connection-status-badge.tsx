"use client";

import Chip from "@mui/material/Chip";
import CircleIcon from "@mui/icons-material/Circle";

export type BadgeStatus = "connected" | "connecting" | "scanning" | "disconnected" | "error";

type ChipColor = "success" | "warning" | "error" | "default";

const STATUS_CONFIG: Record<BadgeStatus, { label: string; color: ChipColor; pulse?: boolean }> = {
  connected: { label: "Connected", color: "success" },
  connecting: { label: "Connecting…", color: "warning", pulse: true },
  scanning: { label: "Scanning…", color: "warning", pulse: true },
  error: { label: "Connection Error", color: "error" },
  disconnected: { label: "Not Connected", color: "default" },
};

export function ConnectionStatusBadge({ status }: { status: BadgeStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <Chip
      size="small"
      color={config.color}
      variant={config.color === "default" ? "outlined" : "filled"}
      icon={
        <CircleIcon
          sx={{
            fontSize: "10px !important",
            ...(config.pulse ? { animation: "connection-badge-pulse 1.5s ease-in-out infinite" } : {}),
          }}
        />
      }
      label={config.label}
      sx={{
        "@keyframes connection-badge-pulse": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.4 },
        },
      }}
    />
  );
}
