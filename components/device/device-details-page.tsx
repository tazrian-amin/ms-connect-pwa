"use client";

import Link from "next/link";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  ConnectionStatusBadge,
  type BadgeStatus,
} from "@/components/device/connection-status-badge";
import { CATEGORY_DETAILS } from "@/components/device/categories";
import { useBluetooth } from "@/context/bluetooth-provider";
import type { DeviceCategory } from "@/types/bluetooth";

interface DeviceDetailsPageProps {
  category: DeviceCategory;
}

export function DeviceDetailsPage({ category }: DeviceDetailsPageProps) {
  const {
    connectedDevice,
    selectedCategory,
    status,
    error,
    supportMessage,
    isSupportChecked,
    connectCategory,
    disconnect,
    clearError,
  } = useBluetooth();

  const isThisCategory = selectedCategory?.id === category.id;
  const isConnected = connectedDevice?.categoryId === category.id;
  const CategoryDetails = CATEGORY_DETAILS[category.id];
  const isPending = isThisCategory && (status === "scanning" || status === "connecting");

  const badgeStatus: BadgeStatus = isConnected
    ? "connected"
    : isPending
      ? (status as "scanning" | "connecting")
      : isThisCategory && status === "error"
        ? "error"
        : "disconnected";

  const handleConnect = async () => {
    clearError();
    await connectCategory(category);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "flex-start" },
        }}
      >
        <Box>
          <Button
            component={Link}
            href="/"
            size="small"
            color="inherit"
            startIcon={<ArrowBackIcon fontSize="small" />}
            sx={{ mb: 1, color: "text.secondary" }}
          >
            Back
          </Button>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Avatar variant="rounded" src={category.image} sx={{ width: 40, height: 40 }} />
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                <Box component="span" sx={{ mr: 0.5 }} aria-hidden="true">
                  {category.icon}
                </Box>
                {category.title}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <ConnectionStatusBadge status={badgeStatus} />
              </Box>
            </Box>
          </Stack>
        </Box>

        {isConnected ? (
          <Button variant="contained" color="error" onClick={handleDisconnect}>
            Disconnect
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleConnect}
            loading={isPending}
            disabled={!isSupportChecked || !!supportMessage}
          >
            Connect Device
          </Button>
        )}
      </Stack>

      {supportMessage && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {supportMessage}
        </Alert>
      )}

      {error && isThisCategory && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {category.description}
      </Typography>

      <CategoryDetails isConnected={isConnected} />
    </Container>
  );
}
