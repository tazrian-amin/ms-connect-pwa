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

export const PUMP_THRESHOLD_ADC_MIN = 0;
export const PUMP_THRESHOLD_ADC_MAX = 4095;

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

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampAdc(value: number): number {
  return clampInt(value, PUMP_THRESHOLD_ADC_MIN, PUMP_THRESHOLD_ADC_MAX);
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
  /** `pump` is 1–6; `adcValue` is clamped to 0–4095. */
  setPumpHighThreshold: (pump: number, adcValue: number) => ({
    [`pump_${pump}_set_high`]: String(clampAdc(adcValue)),
  }),
  /** `pump` is 1–6; `adcValue` is clamped to 0–4095. */
  setPumpLowThreshold: (pump: number, adcValue: number) => ({
    [`pump_${pump}_set_low`]: String(clampAdc(adcValue)),
  }),
  echoPumpHighThreshold: (pump: number) => ({
    echo: `pump_${pump}_high_thr`,
  }),
  echoPumpLowThreshold: (pump: number) => ({
    echo: `pump_${pump}_low_thr`,
  }),
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
  ...Array.from({ length: 6 }, (_, i) => i + 1).flatMap((pump) => [
    {
      label: `Pump ${pump} high thr`,
      command: retrofitFloatCommands.echoPumpHighThreshold(pump),
    },
    {
      label: `Pump ${pump} low thr`,
      command: retrofitFloatCommands.echoPumpLowThreshold(pump),
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
  ...Array.from({ length: 6 }, (_, i) => i + 1).flatMap((pump) => [
    {
      label: `Pump ${pump} high (ADC)`,
      command: retrofitFloatCommands.setPumpHighThreshold(pump, 2500),
    },
    {
      label: `Pump ${pump} low (ADC)`,
      command: retrofitFloatCommands.setPumpLowThreshold(pump, 1000),
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
