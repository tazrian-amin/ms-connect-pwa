"use client";

import Image from "next/image";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

const MINING_SENTRY_URL = "https://www.mining-sentry.com/";

export function Header() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        backdropFilter: "blur(6px)",
      }}
    >
      <Container maxWidth="xl">
        <Toolbar
          variant="dense"
          disableGutters
          sx={{ minHeight: 56, justifyContent: "space-between" }}
        >
          <Box
            component={Link}
            href="/"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              textDecoration: "none",
            }}
          >
            <Image
              src="/icons/icon.svg"
              alt="MS Connect logo"
              width={32}
              height={32}
              style={{
                filter: isDark ? "invert(1)" : "none",
              }}
            />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: "secondary.main" }}
            >
              MS Connect
            </Typography>
          </Box>
          <Typography
            component="a"
            href={MINING_SENTRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "text.secondary",
              textDecoration: "none",
              "&:hover": { color: "secondary.main" },
            }}
          >
            Mining Sentry
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
