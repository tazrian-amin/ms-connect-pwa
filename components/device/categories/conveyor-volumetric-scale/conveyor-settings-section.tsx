"use client";

import { useState, type KeyboardEvent } from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { ScalePalette } from "./constants";
import {
  MATERIAL_TYPE_OPTIONS,
  type ConveyorSettings,
  type MaterialType,
} from "./conveyor-settings";
import {
  BELT_LIMIT_FIELDS,
  PRODUCTION_GOAL_FIELDS,
  PRODUCTION_LIMIT_FIELDS,
  SCALE_LIMIT_FIELDS,
  type ScaleLimitField,
  type ScaleLimits,
} from "./scale-settings";
import {
  ApplyButton,
  FieldBlock,
  SettingsGroup,
  SettingsPanel,
  settingsInputSx,
  useApplyState,
} from "./settings-parts";
import {
  DENSITY_UNITS,
  formatQuantity,
  fromDisplay,
  SPEED_UNITS,
  toDisplay,
  unitKeyFor,
  unitLabel,
  WEIGHT_UNITS,
  type MeasurementUnits,
  type Quantity,
  type UnitDefinition,
} from "./units";

/** Only the parts that changed are passed; the rest are null. */
export interface ConveyorSettingsChange {
  /** Set when the device needs the material/belt speed command re-sent. */
  conveyor: ConveyorSettings | null;
  limits: ScaleLimits | null;
  units: MeasurementUnits | null;
}

interface ConveyorSettingsSectionProps {
  /** Material and belt speed, as the device was last sent them. */
  settings: ConveyorSettings;
  /** The scale's belt and production thresholds and goals. */
  limits: ScaleLimits;
  /** The units every input is shown and entered in. */
  units: MeasurementUnits;
  /**
   * Saves the changes and resolves true once they have landed — false if not,
   * so the button can offer the press again.
   */
  onApply: (change: ConveyorSettingsChange) => Promise<boolean>;
  /** Read-only dashboard — every field and the Apply button are inert. */
  locked?: boolean;
}

/** Every numeric input in the section. */
type ValueField = "density" | "beltSpeed" | ScaleLimitField;

type Values = Record<ValueField, string>;

/** The applied values, in their stored base units. */
type StoredValues = Pick<ConveyorSettings, "density" | "beltSpeed"> &
  ScaleLimits;

const FIELD_QUANTITY: Record<ValueField, Quantity> = {
  density: "density",
  beltSpeed: "speed",
  ...(Object.fromEntries(
    SCALE_LIMIT_FIELDS.map((field) => [field.key, field.quantity]),
  ) as Record<ScaleLimitField, Quantity>),
};

const VALUE_FIELDS = Object.keys(FIELD_QUANTITY) as ValueField[];

interface Draft {
  materialType: MaterialType;
  units: MeasurementUnits;
  values: Values;
}

/** The stored values as the inputs show them in `units`. */
function renderValues(stored: StoredValues, units: MeasurementUnits): Values {
  return Object.fromEntries(
    VALUE_FIELDS.map((field) => {
      const value = stored[field];
      return [
        field,
        value == null
          ? ""
          : formatQuantity(toDisplay(value, FIELD_QUANTITY[field], units)),
      ];
    }),
  ) as Values;
}

/** Digits and a single decimal point. A number input still admits "-" and "e". */
function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  return dot === -1
    ? cleaned
    : cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
}

function parseNumber(value: string): number | null {
  if (value === "" || value === ".") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameUnits(a: MeasurementUnits, b: MeasurementUnits): boolean {
  return (
    a.density === b.density && a.speed === b.speed && a.weight === b.weight
  );
}

/**
 * Everything the scale needs to know about its conveyor: the units it is all
 * entered in, the material on the belt (dry or wet, and how dense), the belt's
 * speed and speed limits, and the production limits and goals its readings are
 * judged against. Editing the fields changes nothing on its own; the changes
 * are saved together on Apply (or Enter).
 */
export function ConveyorSettingsSection({
  settings,
  limits,
  units,
  onApply,
  locked = false,
}: ConveyorSettingsSectionProps) {
  const stored: StoredValues = {
    density: settings.density,
    beltSpeed: settings.beltSpeed,
    ...limits,
  };

  const [draft, setDraft] = useState<Draft>(() => ({
    materialType: settings.materialType,
    units,
    values: renderValues(stored, units),
  }));
  const [error, setError] = useState<string | null>(null);
  const { applyState, isApplying, run } = useApplyState();

  // Newly applied settings — or the dashboard going read-only — discard any
  // half-finished edit, so it can never be applied later by surprise.
  const [prevSettings, setPrevSettings] = useState(settings);
  const [prevLimits, setPrevLimits] = useState(limits);
  const [prevUnits, setPrevUnits] = useState(units);
  const [prevLocked, setPrevLocked] = useState(locked);
  if (
    settings !== prevSettings ||
    limits !== prevLimits ||
    units !== prevUnits ||
    locked !== prevLocked
  ) {
    setPrevSettings(settings);
    setPrevLimits(limits);
    setPrevUnits(units);
    setPrevLocked(locked);
    setDraft({
      materialType: settings.materialType,
      units,
      values: renderValues(stored, units),
    });
    setError(null);
  }

  // What the inputs would show if nothing had been edited, in the draft's
  // units — the yardstick for which fields the user has actually touched.
  const untouched = renderValues(stored, draft.units);
  const isTouched = (field: ValueField) =>
    draft.values[field] !== untouched[field];

  const unitsChanged = !sameUnits(draft.units, units);
  const conveyorValuesChanged =
    draft.materialType !== settings.materialType ||
    isTouched("density") ||
    isTouched("beltSpeed");
  const limitsChanged = SCALE_LIMIT_FIELDS.some((field) =>
    isTouched(field.key),
  );
  const isDirty = unitsChanged || conveyorValuesChanged || limitsChanged;
  const fieldsDisabled = locked || isApplying;
  const canApply = !locked && !isApplying && isDirty;

  /**
   * A touched field is parsed and converted back to its base unit; an
   * untouched one keeps its stored value exactly, so a unit round trip can
   * never nudge it.
   */
  const resolve = (field: ValueField): number | null => {
    if (!isTouched(field)) return stored[field];
    const parsed = parseNumber(draft.values[field]);
    return parsed == null
      ? null
      : fromDisplay(parsed, FIELD_QUANTITY[field], draft.units);
  };

  const changeUnit = <K extends keyof MeasurementUnits>(
    key: K,
    unit: MeasurementUnits[K],
  ) =>
    setDraft((prev) => {
      const nextUnits = { ...prev.units, [key]: unit };
      const before = renderValues(stored, prev.units);
      const after = renderValues(stored, nextUnits);
      const values = { ...prev.values };
      for (const field of VALUE_FIELDS) {
        const quantity = FIELD_QUANTITY[field];
        if (unitKeyFor(quantity) !== key) continue;
        if (prev.values[field] === before[field]) {
          // Untouched: re-render from the stored value, not the rounded text.
          values[field] = after[field];
          continue;
        }
        // Edited: carry the typed quantity across, so it keeps its meaning.
        const parsed = parseNumber(prev.values[field]);
        if (parsed == null) continue;
        values[field] = formatQuantity(
          toDisplay(
            fromDisplay(parsed, quantity, prev.units),
            quantity,
            nextUnits,
          ),
        );
      }
      return { ...prev, units: nextUnits, values };
    });

  const apply = async () => {
    if (!canApply) return;

    const density = resolve("density");
    const beltSpeed = resolve("beltSpeed");
    const hasConveyorValues =
      density != null && density > 0 && beltSpeed != null && beltSpeed > 0;

    // Material and belt speed go to the device as one command, so they are
    // only required once something in that command has changed.
    if (conveyorValuesChanged && !hasConveyorValues) {
      setError("Enter the material density and belt speed.");
      return;
    }

    const nextLimits = {} as ScaleLimits;
    for (const field of SCALE_LIMIT_FIELDS) {
      const value =
        draft.values[field.key].trim() === "" ? 0 : resolve(field.key);
      if (value == null || value < 0) {
        setError(`${field.label} must be a valid number.`);
        return;
      }
      nextLimits[field.key] = value;
    }
    setError(null);

    // The command carries density and speed in the selected units, so a
    // change to either unit re-sends it even when the values are unchanged.
    const commandUnitsChanged =
      draft.units.density !== units.density ||
      draft.units.speed !== units.speed;

    await run(() =>
      onApply({
        conveyor:
          hasConveyorValues && (conveyorValuesChanged || commandUnitsChanged)
            ? { materialType: draft.materialType, density, beltSpeed }
            : null,
        limits: limitsChanged ? nextLimits : null,
        units: unitsChanged ? draft.units : null,
      }),
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void apply();
  };

  const valueField = (field: ValueField, label: string) => (
    <ValueInput
      key={field}
      label={label}
      value={draft.values[field]}
      unit={unitLabel(FIELD_QUANTITY[field], draft.units)}
      disabled={fieldsDisabled}
      onKeyDown={handleKeyDown}
      onChange={(value) =>
        setDraft((prev) => ({
          ...prev,
          values: { ...prev.values, [field]: value },
        }))
      }
    />
  );

  return (
    <SettingsPanel
      title="Scale Settings"
      description="The material on the belt, how the belt runs, and the production limits and goals the scale's readings are judged against."
    >
      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 1.5,
        }}
      >
        {/* Full width, and first: every field below is shown in these. */}
        <Box sx={{ gridColumn: { md: "1 / -1" } }}>
          <SettingsGroup title="Units">
            <UnitSelect
              label="Density"
              value={draft.units.density}
              options={DENSITY_UNITS}
              disabled={fieldsDisabled}
              onChange={(unit) => changeUnit("density", unit)}
            />
            <UnitSelect
              label="Speed"
              value={draft.units.speed}
              options={SPEED_UNITS}
              disabled={fieldsDisabled}
              onChange={(unit) => changeUnit("speed", unit)}
            />
            <UnitSelect
              label="Weight (rates per hour)"
              value={draft.units.weight}
              options={WEIGHT_UNITS}
              disabled={fieldsDisabled}
              onChange={(unit) => changeUnit("weight", unit)}
            />
          </SettingsGroup>
        </Box>

        <SettingsGroup title="Material">
          <FieldBlock label="Type">
            <RadioGroup
              row
              value={draft.materialType}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  materialType: event.target.value as MaterialType,
                }))
              }
              sx={{ gap: 2, minHeight: 40 }}
            >
              {MATERIAL_TYPE_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  disabled={fieldsDisabled}
                  control={<Radio size="small" />}
                  label={
                    <Typography
                      sx={{
                        color: ScalePalette.text,
                        fontSize: 14,
                        fontWeight: 600,
                        lineHeight: "20px",
                      }}
                    >
                      {option.label}
                    </Typography>
                  }
                  sx={{ m: 0, gap: 0.75 }}
                />
              ))}
            </RadioGroup>
          </FieldBlock>

          {valueField("density", "Density")}
        </SettingsGroup>

        <SettingsGroup title="Belt">
          {valueField("beltSpeed", "Belt Speed")}
          {BELT_LIMIT_FIELDS.map((field) => valueField(field.key, field.label))}
        </SettingsGroup>

        {/* Full width: rates and goals read side by side. */}
        <Box sx={{ gridColumn: { md: "1 / -1" } }}>
          <SettingsGroup title="Production">
            {PRODUCTION_LIMIT_FIELDS.map((field) =>
              valueField(field.key, field.label),
            )}
            {PRODUCTION_GOAL_FIELDS.map((field) =>
              valueField(field.key, field.label),
            )}
          </SettingsGroup>
        </Box>
      </Box>

      {error ? (
        <Typography
          variant="body2"
          color="error"
          sx={{ mt: 1.5, textAlign: "right" }}
        >
          {error}
        </Typography>
      ) : null}

      <ApplyButton
        applyState={applyState}
        disabled={!canApply}
        onClick={() => void apply()}
      />
    </SettingsPanel>
  );
}

function ValueInput({
  label,
  value,
  unit,
  disabled,
  onKeyDown,
  onChange,
}: {
  label: string;
  value: string;
  unit: string;
  disabled: boolean;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onChange: (value: string) => void;
}) {
  return (
    <FieldBlock label={label} grow>
      <TextField
        size="small"
        value={value}
        placeholder="0"
        disabled={disabled}
        onChange={(event) => onChange(sanitizeDecimal(event.target.value))}
        onKeyDown={onKeyDown}
        slotProps={{
          htmlInput: {
            inputMode: "decimal",
            "aria-label": label,
            style: { textAlign: "right" },
          },
          input: {
            endAdornment: (
              <InputAdornment position="end">{unit}</InputAdornment>
            ),
          },
        }}
        sx={settingsInputSx}
      />
    </FieldBlock>
  );
}

function UnitSelect<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: T;
  options: UnitDefinition<T>[];
  disabled: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <FieldBlock label={label} grow>
      <Select
        size="small"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as T)}
        inputProps={{ "aria-label": `${label} unit` }}
        sx={{ borderRadius: "10px", bgcolor: ScalePalette.rowBg }}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FieldBlock>
  );
}
