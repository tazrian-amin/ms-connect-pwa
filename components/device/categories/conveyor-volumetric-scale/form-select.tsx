"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";

interface FormSelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function FormSelect<T extends string>({ label, value, options, onChange }: FormSelectProps<T>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 0.75 }}>
      <Typography variant="body2">{label}</Typography>
      <Select
        size="small"
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}
