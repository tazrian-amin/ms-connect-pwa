"use client";

import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export function Header() {
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
      <Container maxWidth="md">
        <Toolbar variant="dense" disableGutters sx={{ minHeight: 56 }}>
          <Typography
            component={Link}
            href="/"
            variant="h6"
            sx={{ fontWeight: 700, color: "secondary.main", textDecoration: "none" }}
          >
            MS Connect
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
