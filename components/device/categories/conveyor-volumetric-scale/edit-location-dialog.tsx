"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs, { type Dayjs } from "dayjs";
import { FormSelect } from "./form-select";
import {
  GOALS_TYPE_OPTIONS,
  RATE_UNIT_OPTIONS,
  SPEED_UNIT_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  applyFormValuesToLocation,
  locationToFormValues,
  validateLocationForm,
  type LocationFormValues,
} from "./location-settings";
import type { ScaleLocation } from "./types";

interface EditLocationDialogProps {
  visible: boolean;
  location: ScaleLocation;
  onSave: (location: ScaleLocation) => void;
  onCancel: () => void;
}

function FormTextField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 0.75 }}>
      <Typography variant="body2">{label}</Typography>
      <TextField size="small" fullWidth value={value} onChange={(event) => onChangeText(event.target.value)} />
    </Box>
  );
}

function FormTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: Dayjs | null) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 0.75 }}>
      <Typography variant="body2">{label}</Typography>
      <TimePicker
        value={dayjs(value, "HH:mm")}
        onChange={onChange}
        ampm={false}
        format="HH:mm"
        slotProps={{ textField: { size: "small", fullWidth: true } }}
      />
    </Box>
  );
}

function FormCheckbox({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <FormControlLabel
      control={<Checkbox checked={checked} onChange={onToggle} />}
      label={label}
    />
  );
}

export function EditLocationDialog({ visible, location, onSave, onCancel }: EditLocationDialogProps) {
  const [form, setForm] = useState<LocationFormValues>(() => locationToFormValues(location));
  const [error, setError] = useState<string | null>(null);
  const [prevVisible, setPrevVisible] = useState(visible);
  const [prevLocation, setPrevLocation] = useState(location);

  if (visible !== prevVisible || location !== prevLocation) {
    setPrevVisible(visible);
    setPrevLocation(location);
    if (visible) {
      setForm(locationToFormValues(location));
      setError(null);
    }
  }

  const updateShiftTime = (shiftIndex: number, field: "startTime" | "endTime", value: Dayjs | null) => {
    if (!value?.isValid()) return;
    const formatted = value.format("HH:mm");
    setForm((prev) => {
      const shiftSchedules = [...prev.shiftSchedules] as LocationFormValues["shiftSchedules"];
      shiftSchedules[shiftIndex] = { ...shiftSchedules[shiftIndex], [field]: formatted };
      return { ...prev, shiftSchedules };
    });
  };

  const handleSave = () => {
    const validationError = validateLocationForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(applyFormValuesToLocation(location, form));
  };

  return (
    <Dialog open={visible} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Edit Location
        <IconButton onClick={onCancel} aria-label="Close edit location dialog" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={0.5}>
          <FormTextField label="Location Name" value={form.name} onChangeText={(name) => setForm((prev) => ({ ...prev, name }))} />

          <FormSelect label="Weight Unit" value={form.weightUnit} options={WEIGHT_UNIT_OPTIONS} onChange={(weightUnit) => setForm((prev) => ({ ...prev, weightUnit }))} />
          <FormSelect label="Rate Unit" value={form.rateUnit} options={RATE_UNIT_OPTIONS} onChange={(rateUnit) => setForm((prev) => ({ ...prev, rateUnit }))} />
          <FormSelect label="Speed Unit" value={form.speedUnit} options={SPEED_UNIT_OPTIONS} onChange={(speedUnit) => setForm((prev) => ({ ...prev, speedUnit }))} />
          <FormSelect label="Goals Type" value={form.goalsType} options={GOALS_TYPE_OPTIONS} onChange={(goalsType) => setForm((prev) => ({ ...prev, goalsType }))} />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <FormTimeField label="Shift 1 Start Time" value={form.shiftSchedules[0].startTime} onChange={(v) => updateShiftTime(0, "startTime", v)} />
            <FormTimeField label="Shift 1 End Time" value={form.shiftSchedules[0].endTime} onChange={(v) => updateShiftTime(0, "endTime", v)} />
            <FormTimeField label="Shift 2 Start Time" value={form.shiftSchedules[1].startTime} onChange={(v) => updateShiftTime(1, "startTime", v)} />
            <FormTimeField label="Shift 2 End Time" value={form.shiftSchedules[1].endTime} onChange={(v) => updateShiftTime(1, "endTime", v)} />
            <FormTimeField label="Shift 3 Start Time" value={form.shiftSchedules[2].startTime} onChange={(v) => updateShiftTime(2, "startTime", v)} />
            <FormTimeField label="Shift 3 End Time" value={form.shiftSchedules[2].endTime} onChange={(v) => updateShiftTime(2, "endTime", v)} />
          </LocalizationProvider>

          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", mt: 1 }}>
            Daily total is always shown on the dashboard.
          </Typography>

          <FormCheckbox label="Show Shift Total" checked={form.showShiftTotal} onToggle={() => setForm((prev) => ({ ...prev, showShiftTotal: !prev.showShiftTotal }))} />
          <FormCheckbox label="Show Job Total" checked={form.showJobTotal} onToggle={() => setForm((prev) => ({ ...prev, showJobTotal: !prev.showJobTotal }))} />
          <FormCheckbox label="Show Scale Total" checked={form.showScaleTotal} onToggle={() => setForm((prev) => ({ ...prev, showScaleTotal: !prev.showScaleTotal }))} />

          {error && (
            <Typography variant="body2" color="error" sx={{ textAlign: "center" }}>
              {error}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="secondary">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
}
