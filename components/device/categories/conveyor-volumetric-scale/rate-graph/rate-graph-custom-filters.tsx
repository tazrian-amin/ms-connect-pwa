"use client";

import { useState } from "react";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";
import type { RateGraphQuery, RateGraphTimeMode } from "./types";
import { formatShiftLabel, validateCustomDateRange, validateCustomTimeRange } from "./rate-graph-utils";
import { rateGraphToggleButtonSx } from "./rate-graph-styles";
import type { ShiftSchedule } from "../types";

interface RateGraphCustomFiltersProps {
  query: RateGraphQuery;
  shiftSchedules: [ShiftSchedule, ShiftSchedule, ShiftSchedule];
  onApply: (query: RateGraphQuery) => void;
  onCancel: () => void;
}

const TIME_MODES: { id: RateGraphTimeMode; label: string }[] = [
  { id: "all-day", label: "All Day" },
  { id: "by-shift", label: "By Shift" },
  { id: "custom-time", label: "Custom" },
];

export function RateGraphCustomFilters({ query, shiftSchedules, onApply, onCancel }: RateGraphCustomFiltersProps) {
  const [draft, setDraft] = useState<RateGraphQuery>(query);
  const [error, setError] = useState<string | null>(null);

  const updateDraft = (patch: Partial<RateGraphQuery>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const handleApply = () => {
    const dateError = validateCustomDateRange(draft.startDate, draft.endDate);
    if (dateError) {
      setError(dateError);
      return;
    }
    const timeError = validateCustomTimeRange(draft.timeMode, draft.customTimeStart, draft.customTimeEnd);
    if (timeError) {
      setError(timeError);
      return;
    }
    onApply({ ...draft, preset: "custom" });
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <DatePicker
                  label="Start Date"
                  value={dayjs(draft.startDate)}
                  onChange={(value) => {
                    if (value?.isValid()) updateDraft({ startDate: value.toDate() });
                  }}
                  maxDate={dayjs(draft.endDate)}
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
                <DatePicker
                  label="End Date"
                  value={dayjs(draft.endDate)}
                  onChange={(value) => {
                    if (value?.isValid()) updateDraft({ endDate: value.toDate() });
                  }}
                  minDate={dayjs(draft.startDate)}
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </Stack>

            <ToggleButtonGroup
              value={draft.timeMode}
              exclusive
              fullWidth
              size="small"
              onChange={(_event, next: RateGraphTimeMode | null) => {
                if (next) updateDraft({ timeMode: next });
              }}
            >
              {TIME_MODES.map((mode) => (
                <ToggleButton key={mode.id} value={mode.id} sx={rateGraphToggleButtonSx}>
                  {mode.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {draft.timeMode === "by-shift" ? (
              <RadioGroup
                value={draft.shiftIndex}
                onChange={(event) => updateDraft({ shiftIndex: Number(event.target.value) as 0 | 1 | 2 })}
              >
                {shiftSchedules.map((schedule, index) => (
                  <FormControlLabel
                    key={`shift-${index}`}
                    value={index}
                    control={<Radio size="small" />}
                    label={formatShiftLabel(index, schedule)}
                  />
                ))}
              </RadioGroup>
            ) : null}

            {draft.timeMode === "custom-time" ? (
              <Stack direction="row" spacing={2}>
                <TimePicker
                  label="Start Time"
                  value={dayjs(draft.customTimeStart, "HH:mm")}
                  onChange={(value) => {
                    if (value?.isValid()) updateDraft({ customTimeStart: value.format("HH:mm") });
                  }}
                  ampm={false}
                  format="HH:mm"
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
                <TimePicker
                  label="End Time"
                  value={dayjs(draft.customTimeEnd, "HH:mm")}
                  onChange={(value) => {
                    if (value?.isValid()) updateDraft({ customTimeEnd: value.format("HH:mm") });
                  }}
                  ampm={false}
                  format="HH:mm"
                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                />
              </Stack>
            ) : null}

            {error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            ) : null}

        <Stack direction="row" spacing={1.5}>
          <Button variant="contained" color="primary" onClick={handleApply}>
            Apply
          </Button>
          <Button variant="outlined" color="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </Stack>
      </Stack>
      </LocalizationProvider>
    </Paper>
  );
}
