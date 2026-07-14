"use client";

import { useState } from "react";
import Link from "next/link";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SearchIcon from "@mui/icons-material/Search";
import { DEVICE_CATEGORIES } from "@/lib/bluetooth/categories";

export function CategoryGrid() {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filteredCategories = normalizedQuery
    ? DEVICE_CATEGORIES.filter((category) =>
        [category.title, category.name, category.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      )
    : DEVICE_CATEGORIES;

  return (
    <Box>
      <TextField
        fullWidth
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search devices by name or description..."
        slotProps={{
          htmlInput: { "aria-label": "Search device categories" },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="disabled" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />

      {filteredCategories.length === 0 ? (
        <Box
          sx={{
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
            px: 2,
            py: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            No devices match &quot;{query}&quot;.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredCategories.map((category) => (
            <Grid key={category.id} size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined">
                <CardActionArea component={Link} href={`/devices/${category.id}`}>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <Avatar variant="rounded" src={category.image} sx={{ width: 48, height: 48 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        <Box component="span" sx={{ mr: 0.5 }} aria-hidden="true">
                          {category.icon}
                        </Box>
                        {category.title}
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
