import { PumpMonitoringPalette } from "./constants";
import type { PumpRunState } from "./types";

/**
 * What the pump is doing, from the three things the device reports about it:
 * whether it has raised a fault, whether it is in the control loop, and
 * whether it is running.
 *
 * A fault outranks the enable flag deliberately. A faulted pump is often
 * disabled straight after — by the operator or, in a later firmware, by the
 * device itself — and "Disabled" would then bury the reason it was switched
 * out. The fault is the thing worth showing until it clears.
 */
export function derivePumpRunState(
  enabled: boolean,
  isOn: boolean,
  faulted: boolean,
): PumpRunState {
  if (faulted) return "fault";
  if (!enabled) return "disabled";
  return isOn ? "run" : "idle";
}

export const PUMP_RUN_STATE_LABELS: Record<PumpRunState, string> = {
  run: "Run",
  idle: "Idle",
  fault: "Fault",
  disabled: "Disabled",
};

/**
 * Colour per state. The word is the whole indicator — there is no dot beside
 * it — so the colour has to carry the same weight the dot used to: green for
 * running and red for a fault, the two that mean something is happening, and
 * two quieter greys for the resting pair. Idle keeps full contrast and disabled
 * is muted, since the difference between "waiting its turn" and "switched out"
 * is the whole point of the row.
 */
export const PUMP_RUN_STATE_TEXT_COLORS: Record<PumpRunState, string> = {
  run: PumpMonitoringPalette.greenActive,
  idle: PumpMonitoringPalette.text,
  fault: PumpMonitoringPalette.redActive,
  disabled: PumpMonitoringPalette.textMuted,
};
