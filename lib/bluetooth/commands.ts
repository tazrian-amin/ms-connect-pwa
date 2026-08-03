import type { DeviceCategoryId } from "@/types/bluetooth";

// Command sets from the "Mining Sentry — System Commands Reference".
// Key casing is firmware-specific (Dewatering: "Set_Data_E_T_sec"/"Echo",
// Retrofit Float: "set_data_e_t_sec"/"echo") — do not normalize it. Numeric
// values are sent as strings for both, matching the reference examples.

/** A ready-to-send echo/diagnostic query with a human label for the UI. */
export interface EchoCommand {
  label: string;
  command: Record<string, string>;
}

// Pump high/low settings are a 0-100 percentage of current_water_level, not
// an ADC value: the pump turns on above HIGH and off below LOW. Both sliders
// span the full water-level range (they may meet but not cross), so the value
// sent is the trigger point itself — no half-range remapping on either side.
// See dewater-pump-float firmware README "Pump ON/OFF control".
export const PUMP_THRESHOLD_PERCENT_MIN = 0;
export const PUMP_THRESHOLD_PERCENT_MAX = 100;

// Retrofit float ("dewater-pump-float") firmware-enforced numeric ranges —
// mirrored here so the UI can clamp before round-tripping over BLE.
export const RETROFIT_DATA_INTERVAL_SEC_MIN = 1;
export const RETROFIT_DATA_INTERVAL_SEC_MAX = 86400;
export const RETROFIT_SENSOR_INIT_SEC_MIN = 0;
export const RETROFIT_SENSOR_INIT_SEC_MAX = 3600;
export const RETROFIT_EMA_SAMPLE_MIN = 1;
export const RETROFIT_EMA_SAMPLE_MAX = 5000;
export const RETROFIT_SAMPLE_PERIOD_MS_MIN = 1000;
export const RETROFIT_SAMPLE_PERIOD_MS_MAX = 86400000;
export const RETROFIT_PUMP_MIN_OFF_TIME_MIN = 0;
export const RETROFIT_PUMP_MIN_OFF_TIME_MAX = 999;

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampPumpThreshold(value: number): number {
  return clampInt(value, PUMP_THRESHOLD_PERCENT_MIN, PUMP_THRESHOLD_PERCENT_MAX);
}

/** DEWATERING — "Dewater Water Level Monitor" (dewater-water-level). */
export const dewateringCommands = {
  setReportingIntervalSec: (seconds: number) => ({
    Set_Data_E_T_sec: String(seconds),
  }),
  setSensorOnDurationSec: (seconds: number) => ({
    Set_PS_On_T_sec: String(seconds),
  }),
  setSensorInitTimeSec: (seconds: number) => ({
    Set_Sensor_Init_T_sec: String(seconds),
  }),
  setEmaSampleRate: (rate: number) => ({ SetSample: String(rate) }),
};

/** RETROFIT FLOAT — "Dewater Pump Float Replacement" (dewater-pump-float). */
export const retrofitFloatCommands = {
  /** 1–86400, persisted; also updates the live sample period. */
  setReportingIntervalSec: (seconds: number) => ({
    set_data_e_t_sec: String(
      clampInt(seconds, RETROFIT_DATA_INTERVAL_SEC_MIN, RETROFIT_DATA_INTERVAL_SEC_MAX),
    ),
  }),
  /** 0–3600, persisted. */
  setSensorInitTimeSec: (seconds: number) => ({
    set_sensor_init_t_sec: String(
      clampInt(seconds, RETROFIT_SENSOR_INIT_SEC_MIN, RETROFIT_SENSOR_INIT_SEC_MAX),
    ),
  }),
  /** 1–5000 (EMA smoothing window), persisted. */
  setEmaSampleRate: (rate: number) => ({
    set_sample: String(clampInt(rate, RETROFIT_EMA_SAMPLE_MIN, RETROFIT_EMA_SAMPLE_MAX)),
  }),
  setBleMode: (mode: "normal" | "sleep") => ({ set_ble_mode: mode }),
  resetBle: () => ({ reset_ble: "1" }),
  /**
   * Reads back the whole block — per pump: state, enable flag, runtime and
   * start counters; per column: thresholds and which pump is bound to it; plus
   * the water level, minimum off time, water band and alteration mode. The
   * dashboard's hydrate-on-connect: the device owns every one of those, and
   * nothing else reports the thresholds, enable flags or bindings.
   */
  getPumpStates: () => ({ cmd: "get_pump_states" }),
  /**
   * Thresholds belong to the *column*, not to the pump. Off alteration that is
   * the same thing — column N is pump N — but on, the column is a role and
   * whichever pump the device has bound to it answers these levels.
   * `column` is 1–6; `percent` (0–100, the raw slider setting) is clamped.
   */
  setColumnHighThreshold: (column: number, percent: number) => ({
    [`column_${column}_set_high`]: String(clampPumpThreshold(percent)),
  }),
  setColumnLowThreshold: (column: number, percent: number) => ({
    [`column_${column}_set_low`]: String(clampPumpThreshold(percent)),
  }),
  /**
   * How the device shares demand across the enabled pumps: 0 = off (column N
   * is pump N), 1 = rotate to equalize starts, 2 = rotate to equalize run
   * time. A control setting, not a view preference — the device owns it.
   */
  setAlterationMode: (mode: number) => ({
    set_alteration_mode: String(clampInt(mode, 0, 2)),
  }),
  /**
   * `pump` is 1–6. UPCOMING FIRMWARE FEATURE — key name is provisional.
   * Disabling also turns the pump off firmware-side, so the PWA never has to
   * send a separate stop; the enabled flag is persisted across reboots.
   */
  setPumpEnabled: (pump: number, enabled: boolean) => ({
    [`pump_${pump}_set_enable`]: enabled ? "1" : "0",
  }),
  /**
   * Minutes a pump must stay off before the control loop may start it again
   * (0–999; 0 = no restart delay). One value covers all six pumps.
   * UPCOMING FIRMWARE FEATURE — key name is provisional.
   */
  setPumpMinOffTimeMin: (minutes: number) => ({
    set_pump_min_off_time_min: String(
      clampInt(minutes, RETROFIT_PUMP_MIN_OFF_TIME_MIN, RETROFIT_PUMP_MIN_OFF_TIME_MAX),
    ),
  }),
  /**
   * `pump` is 1–6. Zeroes that pump's session runtime; the lifetime total is
   * never resettable. The device answers with the counter, so the reply is
   * what the UI reads the new value from.
   */
  resetPumpRuntime: (pump: number) => ({
    [`pump_${pump}_reset_runtime`]: "1",
  }),
  /**
   * `pump` is 1–6. Zeroes that pump's session start count and nothing else —
   * the session runtime and both lifetime totals are left as they are. Same
   * shape as the runtime reset: the device answers with the counter.
   *
   * UPCOMING FIRMWARE FEATURE — key name is provisional. Today's firmware has
   * no separate key: `pump_N_reset_runtime` clears the whole session pair, so
   * until it lands this command is answered as unknown.
   */
  resetPumpStarts: (pump: number) => ({
    [`pump_${pump}_reset_starts`]: "1",
  }),
  /**
   * Water-level alarm band, as absolute water-level percentages (0–100). The
   * device stores and reports them; no alarm output is wired to them yet.
   */
  setWaterHighThreshold: (percent: number) => ({
    set_water_high_thr: String(clampPumpThreshold(percent)),
  }),
  setWaterLowThreshold: (percent: number) => ({
    set_water_low_thr: String(clampPumpThreshold(percent)),
  }),
  echoColumnHighThreshold: (column: number) => ({
    echo: `column_${column}_high_thr`,
  }),
  echoColumnLowThreshold: (column: number) => ({
    echo: `column_${column}_low_thr`,
  }),
  echoAlterationMode: () => ({ echo: "alteration_mode" }),
  echoPumpEnabled: (pump: number) => ({
    echo: `pump_${pump}_enabled`,
  }),
  /** Which pump the device has bound to this column; 0 = none yet (T.B.D.). */
  echoColumnPump: (column: number) => ({
    echo: `column_${column}_pump`,
  }),
  /** Lifetime starts, and starts since the operator's last reset. */
  echoPumpTotalStarts: (pump: number) => ({
    echo: `pump_${pump}_total_starts`,
  }),
  echoPumpCurrentStarts: (pump: number) => ({
    echo: `pump_${pump}_current_starts`,
  }),
  echoPumpMinOffTime: () => ({ echo: "pump_min_off_time_min" }),
  echoWaterHighThreshold: () => ({ echo: "water_high_thr" }),
  echoWaterLowThreshold: () => ({ echo: "water_low_thr" }),
  // Flat-style identity commands — same effect as cmd-style "set_config":
  // the MCU saves the field(s) and resets to sync with Notehub.
  setProductUid: (uid: string) => ({ set_product_uid: uid }),
  setSerialNumber: (serial: string) => ({ set_serial_number: serial }),
  /** Clears stored product_uid/serial_number only; MCU resets into first-boot setup. */
  resetConfig: () => ({ cmd: "reset_config" }),
};

// Commands whose firmware handler saves identity and then resets the MCU —
// the BLE link is expected to drop shortly after the reply arrives.
export function commandTriggersMcuReset(commandObj: unknown): boolean {
  if (!commandObj || typeof commandObj !== "object") return false;
  const obj = commandObj as Record<string, unknown>;
  if (obj.cmd === "set_config" || obj.cmd === "reset_config") return true;
  return "set_product_uid" in obj || "set_serial_number" in obj;
}

/**
 * VOLUMETRIC — "Conveyor Volumetric Scale" and "Pro"
 * (conveyor-volumetric-scale, conveyor-volumetric-scale-pro).
 * Diagnostics for this family arrive as published notefiles (device.qo,
 * data.qo, config_ack.qo, error.qo) rather than echo queries.
 */
export const volumetricCommands = {
  /** Critical: a wrong value takes the device offline. Max 63 chars. */
  setProductUid: (uid: string) => ({ product_uid: uid }),
  /** 1–5; re-initializes sensor hardware on change. */
  setTofSensorCount: (count: number) => ({ tof_sensor_count: count }),
  /** 4 = 4×4 grid, 8 = 8×8 grid; re-initializes sensor hardware on change. */
  setTofResolution: (resolution: 4 | 8) => ({ tof_resolution: resolution }),
  setCloudIntervalMinutes: (minutes: number) => ({
    cloud_interval_minutes: minutes,
  }),
  setSamplesToAverage: (samples: number) => ({ samples_to_average: samples }),
  /** Max 31 chars, e.g. "MS-Volumetric-54161". */
  setDeviceModel: (model: string) => ({ device_model: model }),
  /** Max 31 chars, e.g. "SN-001". */
  setSerialNumber: (serial: string) => ({ serial_number: serial }),
};

const DEWATERING_ECHO_COMMANDS: EchoCommand[] = [
  { label: "Firmware version", command: { Echo: "Embedded_Software_Ver" } },
  { label: "Data send interval", command: { Echo: "Set_Data_E_T_sec" } },
  { label: "Sensor init time", command: { Echo: "Set_Sensor_Init_T_sec" } },
  { label: "Sensor on duration", command: { Echo: "Set_PS_On_T_sec" } },
  { label: "EMA sample rate", command: { Echo: "Sample_Rate" } },
  { label: "Notehub UID", command: { Echo: "UID" } },
];

const RETROFIT_FLOAT_ECHO_COMMANDS: EchoCommand[] = [
  { label: "Get status", command: { cmd: "get_status" } },
  { label: "MCU firmware version", command: { echo: "embedded_software_ver" } },
  { label: "Notecard version", command: { echo: "notecard_ver" } },
  { label: "Data send interval", command: { echo: "set_data_e_t_sec" } },
  { label: "Sensor init time", command: { echo: "set_sensor_init_t_sec" } },
  { label: "EMA sample rate", command: { echo: "sample_rate" } },
  { label: "BLE state", command: { echo: "ble_state" } },
  { label: "Notehub UID", command: { echo: "uid" } },
  { label: "Sensor ADC value", command: { echo: "sensor_adc_value" } },
  {
    label: "Pump min off time (min)",
    command: retrofitFloatCommands.echoPumpMinOffTime(),
  },
  {
    label: "Water high threshold",
    command: retrofitFloatCommands.echoWaterHighThreshold(),
  },
  {
    label: "Water low threshold",
    command: retrofitFloatCommands.echoWaterLowThreshold(),
  },
  {
    label: "Alteration mode",
    command: retrofitFloatCommands.echoAlterationMode(),
  },
  ...Array.from({ length: 6 }, (_, i) => i + 1).flatMap((n) => [
    {
      label: `Column ${n} high thr`,
      command: retrofitFloatCommands.echoColumnHighThreshold(n),
    },
    {
      label: `Column ${n} low thr`,
      command: retrofitFloatCommands.echoColumnLowThreshold(n),
    },
    {
      label: `Column ${n} pump`,
      command: retrofitFloatCommands.echoColumnPump(n),
    },
    {
      label: `Pump ${n} enabled`,
      command: retrofitFloatCommands.echoPumpEnabled(n),
    },
    {
      label: `Pump ${n} total starts`,
      command: retrofitFloatCommands.echoPumpTotalStarts(n),
    },
    {
      label: `Pump ${n} current starts`,
      command: retrofitFloatCommands.echoPumpCurrentStarts(n),
    },
  ]),
];

// Categories without a documented command set keep the current generic
// get_config echo until their firmware commands are specified.
const DEFAULT_ECHO_COMMANDS: EchoCommand[] = [
  { label: "Get config", command: { cmd: "get_config" } },
];

export const CATEGORY_ECHO_COMMANDS: Record<DeviceCategoryId, EchoCommand[]> = {
  "discharge-water-flow": DEFAULT_ECHO_COMMANDS,
  "dewater-water-level": DEWATERING_ECHO_COMMANDS,
  "dewater-pump-float": RETROFIT_FLOAT_ECHO_COMMANDS,
  "conveyor-volumetric-scale": [],
  "conveyor-volumetric-scale-pro": [],
  "bin-height-measurement": DEFAULT_ECHO_COMMANDS,
};

/**
 * A configuration command pre-filled with the reference doc's example value.
 * Meant for loading into the console input so the value can be adjusted
 * before sending (unlike echo commands, which carry no value).
 */
export interface ConfigCommandTemplate {
  label: string;
  command: Record<string, string | number>;
}

const DEWATERING_CONFIG_COMMANDS: ConfigCommandTemplate[] = [
  {
    label: "Reporting interval (sec)",
    command: dewateringCommands.setReportingIntervalSec(900),
  },
  {
    label: "Sensor ON duration (sec)",
    command: dewateringCommands.setSensorOnDurationSec(60),
  },
  {
    label: "Sensor init time (sec)",
    command: dewateringCommands.setSensorInitTimeSec(20),
  },
  { label: "EMA smoothing", command: dewateringCommands.setEmaSampleRate(200) },
];

const RETROFIT_FLOAT_CONFIG_COMMANDS: ConfigCommandTemplate[] = [
  {
    label: "Reporting interval (sec)",
    command: retrofitFloatCommands.setReportingIntervalSec(900),
  },
  {
    label: "Sensor init time (sec)",
    command: retrofitFloatCommands.setSensorInitTimeSec(20),
  },
  {
    label: "EMA smoothing",
    command: retrofitFloatCommands.setEmaSampleRate(200),
  },
  { label: "BLE mode: normal", command: retrofitFloatCommands.setBleMode("normal") },
  { label: "BLE mode: sleep", command: retrofitFloatCommands.setBleMode("sleep") },
  { label: "Reset BLE module", command: retrofitFloatCommands.resetBle() },
  // The next three reset the MCU after replying — the BLE link is expected
  // to drop (see commandTriggersMcuReset / bluetooth-provider reconnection).
  {
    label: "Set product UID",
    command: retrofitFloatCommands.setProductUid("com.company.project:product"),
  },
  {
    label: "Set serial number",
    command: retrofitFloatCommands.setSerialNumber("SN-001"),
  },
  { label: "Reset config", command: retrofitFloatCommands.resetConfig() },
  {
    label: "Pump min off time (min)",
    command: retrofitFloatCommands.setPumpMinOffTimeMin(15),
  },
  {
    label: "Alteration mode",
    command: retrofitFloatCommands.setAlterationMode(1),
  },
  ...Array.from({ length: 6 }, (_, i) => i + 1).flatMap((n) => [
    {
      label: `Column ${n} high (%)`,
      command: retrofitFloatCommands.setColumnHighThreshold(n, 65),
    },
    {
      label: `Column ${n} low (%)`,
      command: retrofitFloatCommands.setColumnLowThreshold(n, 30),
    },
    {
      label: `Pump ${n} enable`,
      command: retrofitFloatCommands.setPumpEnabled(n, true),
    },
  ]),
];

const VOLUMETRIC_CONFIG_COMMANDS: ConfigCommandTemplate[] = [
  {
    label: "Product UID",
    command: volumetricCommands.setProductUid("com.company.project:product"),
  },
  { label: "ToF sensor count", command: volumetricCommands.setTofSensorCount(1) },
  { label: "ToF resolution", command: volumetricCommands.setTofResolution(4) },
  {
    label: "Cloud interval (min)",
    command: volumetricCommands.setCloudIntervalMinutes(5),
  },
  {
    label: "Samples to average",
    command: volumetricCommands.setSamplesToAverage(10),
  },
  {
    label: "Device model",
    command: volumetricCommands.setDeviceModel("MS-Volumetric-54161"),
  },
  {
    label: "Serial number",
    command: volumetricCommands.setSerialNumber("SN-001"),
  },
];

export const CATEGORY_CONFIG_COMMANDS: Record<
  DeviceCategoryId,
  ConfigCommandTemplate[]
> = {
  "discharge-water-flow": [],
  "dewater-water-level": DEWATERING_CONFIG_COMMANDS,
  "dewater-pump-float": RETROFIT_FLOAT_CONFIG_COMMANDS,
  "conveyor-volumetric-scale": VOLUMETRIC_CONFIG_COMMANDS,
  "conveyor-volumetric-scale-pro": VOLUMETRIC_CONFIG_COMMANDS,
  "bin-height-measurement": [],
};
