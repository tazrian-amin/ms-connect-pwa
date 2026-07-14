"use client";

import Alert from "@mui/material/Alert";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { CategoryGrid } from "@/components/home/category-grid";
import { useBluetooth } from "@/context/bluetooth-provider";

export function HomePage() {
  const { supportMessage } = useBluetooth();

  return (
    <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }} gutterBottom>
        Connect Your Device
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Pair Bluetooth devices, monitor live data, and manage connections.
      </Typography>

      {supportMessage && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {supportMessage}
        </Alert>
      )}

      <Typography variant="h6" component="h2" gutterBottom>
        Device Categories
      </Typography>
      <CategoryGrid />
    </Container>
  );
}
