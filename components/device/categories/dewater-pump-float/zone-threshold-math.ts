import { THRESHOLD_POINTER_HEIGHT } from "./constants";

function zoneTravel(zoneTop: number, zoneBottom: number) {
  return zoneBottom - zoneTop - THRESHOLD_POINTER_HEIGHT;
}

/** Map 0–100 (zone bottom→top) to `top` offset inside the zone hit area. */
export function zoneLevelToRelativeTop(
  level: number,
  zoneTop: number,
  zoneBottom: number,
): number {
  return (1 - level / 100) * zoneTravel(zoneTop, zoneBottom);
}

/** Map relative `top` inside the zone to 0–100. */
export function zoneRelativeTopToLevel(
  relativeTop: number,
  zoneTop: number,
  zoneBottom: number,
): number {
  const travel = zoneTravel(zoneTop, zoneBottom);
  return Math.min(
    100,
    Math.max(0, Math.round(100 * (1 - relativeTop / travel))),
  );
}

export function zoneRelativeMaxTop(zoneTop: number, zoneBottom: number) {
  return zoneTravel(zoneTop, zoneBottom);
}
