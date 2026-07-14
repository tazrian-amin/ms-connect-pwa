"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { FormSelect } from "./form-select";
import {
  SCALE_COLOR_OPTIONS,
  applyFormValuesToScale,
  formatFeedScaleLocationLabel,
  scaleToFormValues,
  validateScaleForm,
  type ScaleFormValues,
} from "./scale-settings";
import type { ScaleColor, ScaleReading } from "./types";

interface LocationOption {
  id: string;
  name: string;
}

interface EditScaleDialogProps {
  visible: boolean;
  scale: ScaleReading;
  locationOptions: LocationOption[];
  defaultLocationId: string;
  onSave: (scale: ScaleReading) => void;
  onClose: () => void;
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 0.5 }}>
      <Typography variant="body2">{label}</Typography>
      <TextField size="small" fullWidth value={value} onChange={(event) => onChangeText(event.target.value)} />
    </Box>
  );
}

function FormNumberField({
  label,
  value,
  onChangeText,
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  unit: string;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 0.5 }}>
      <Typography variant="body2">{label}</Typography>
      <TextField
        size="small"
        fullWidth
        value={value}
        onChange={(event) => onChangeText(event.target.value)}
        slotProps={{
          htmlInput: { inputMode: "decimal", style: { textAlign: "right" } },
          input: unit ? { endAdornment: <InputAdornment position="end">{unit}</InputAdornment> } : undefined,
        }}
      />
    </Box>
  );
}

function FormCheckbox({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return <FormControlLabel control={<Checkbox checked={checked} onChange={onToggle} />} label={label} />;
}

function ColorFormSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ScaleColor;
  onChange: (value: ScaleColor) => void;
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, py: 0.75 }}>
      <Typography variant="body2">{label}</Typography>
      <Select
        size="small"
        fullWidth
        value={value}
        onChange={(event) => onChange(event.target.value as ScaleColor)}
        renderValue={(selected) => {
          const option = SCALE_COLOR_OPTIONS.find((o) => o.value === selected);
          return (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: option?.swatch, border: 1, borderColor: "divider" }} />
              <span>{option?.label}</span>
            </Stack>
          );
        }}
      >
        {SCALE_COLOR_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: option.swatch, border: 1, borderColor: "divider" }} />
              <span>{option.label}</span>
            </Stack>
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export function EditScaleDialog({
  visible,
  scale,
  locationOptions,
  defaultLocationId,
  onSave,
  onClose,
}: EditScaleDialogProps) {
  const [form, setForm] = useState<ScaleFormValues>(() => scaleToFormValues(scale));
  const [error, setError] = useState<string | null>(null);
  const [prevVisible, setPrevVisible] = useState(visible);
  const [prevScale, setPrevScale] = useState(scale);
  const [prevDefaultLocationId, setPrevDefaultLocationId] = useState(defaultLocationId);

  const feedLocationOptions = useMemo(
    () =>
      locationOptions.map((location) => ({
        value: location.id,
        label: formatFeedScaleLocationLabel(location.name),
      })),
    [locationOptions],
  );

  if (visible !== prevVisible || scale !== prevScale || defaultLocationId !== prevDefaultLocationId) {
    setPrevVisible(visible);
    setPrevScale(scale);
    setPrevDefaultLocationId(defaultLocationId);
    if (visible) {
      const nextForm = scaleToFormValues(scale);
      if (!nextForm.feedScaleLocationId && defaultLocationId) {
        nextForm.feedScaleLocationId = defaultLocationId;
      }
      setForm(nextForm);
      setError(null);
    }
  }

  const handleSave = () => {
    const validationError = validateScaleForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(applyFormValuesToScale(scale, form));
  };

  return (
    <Dialog open={visible} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Edit Scale
        <IconButton onClick={onClose} aria-label="Close edit scale dialog" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack spacing={0.5}>
              <FormTextField label="Conveyor Name" value={form.conveyorName} onChangeText={(v) => setForm((prev) => ({ ...prev, conveyorName: v }))} />
              <FormTextField label="IP Address" value={form.ipAddress} onChangeText={(v) => setForm((prev) => ({ ...prev, ipAddress: v }))} />
              <FormNumberField label="High Production Limit" value={form.highProductionLimit} onChangeText={(v) => setForm((prev) => ({ ...prev, highProductionLimit: v }))} unit="ton / hr" />
              <FormNumberField label="Low Production Limit" value={form.lowProductionLimit} onChangeText={(v) => setForm((prev) => ({ ...prev, lowProductionLimit: v }))} unit="ton / hr" />
              <FormNumberField label="High Belt Speed Limit" value={form.highBeltSpeedLimit} onChangeText={(v) => setForm((prev) => ({ ...prev, highBeltSpeedLimit: v }))} unit="ft / min" />
              <FormNumberField label="Daily Production Goal" value={form.dailyProductionGoal} onChangeText={(v) => setForm((prev) => ({ ...prev, dailyProductionGoal: v }))} unit="Ton" />
              <FormNumberField label="Shift 2 Production Goal" value={form.shift2ProductionGoal} onChangeText={(v) => setForm((prev) => ({ ...prev, shift2ProductionGoal: v }))} unit="Ton" />
              <FormCheckbox label="Feed Scale" checked={form.isFeedScale} onToggle={() => setForm((prev) => ({ ...prev, isFeedScale: !prev.isFeedScale }))} />
              {form.isFeedScale ? (
                <FormSelect
                  label="Feed Scales"
                  value={form.feedScaleLocationId}
                  options={feedLocationOptions}
                  onChange={(feedScaleLocationId) => setForm((prev) => ({ ...prev, feedScaleLocationId }))}
                />
              ) : null}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack spacing={0.5}>
              <FormTextField label="Scale Name (optional)" value={form.scaleNameOptional} onChangeText={(v) => setForm((prev) => ({ ...prev, scaleNameOptional: v }))} />
              <FormNumberField label="Modbus Address" value={form.modbusAddress} onChangeText={(v) => setForm((prev) => ({ ...prev, modbusAddress: v }))} unit="" />
              <FormNumberField label="Target Production Rate" value={form.targetProductionRate} onChangeText={(v) => setForm((prev) => ({ ...prev, targetProductionRate: v }))} unit="ton / hr" />
              <FormNumberField label="Black Belt Limit" value={form.blackBeltLimit} onChangeText={(v) => setForm((prev) => ({ ...prev, blackBeltLimit: v }))} unit="ton / hr" />
              <FormNumberField label="Stopped Belt Limit" value={form.stoppedBeltLimit} onChangeText={(v) => setForm((prev) => ({ ...prev, stoppedBeltLimit: v }))} unit="ft / min" />
              <FormNumberField label="Shift 1 Production Goal" value={form.shift1ProductionGoal} onChangeText={(v) => setForm((prev) => ({ ...prev, shift1ProductionGoal: v }))} unit="Ton" />
              <FormNumberField label="Shift 3 Production Goal" value={form.shift3ProductionGoal} onChangeText={(v) => setForm((prev) => ({ ...prev, shift3ProductionGoal: v }))} unit="Ton" />
              <ColorFormSelect label="Colors List" value={form.color} onChange={(color) => setForm((prev) => ({ ...prev, color }))} />
            </Stack>
          </Grid>
        </Grid>

        {error && (
          <Typography variant="body2" color="error" sx={{ textAlign: "center", mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Close
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
