import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import {
  LED_COLUMN_HEIGHT,
  LED_COLUMN_WIDTH,
  LEVEL_SCALE_GAP,
  LEVEL_SCALE_LABEL_STEP,
  LEVEL_SCALE_MID_STEP,
  LEVEL_SCALE_TICK_MAJOR,
  LEVEL_SCALE_TICK_MID,
  LEVEL_SCALE_TICK_MINOR,
  LEVEL_SCALE_WIDTH,
  PumpMonitoringPalette,
  WATER_LEVEL_MAX_FEET,
} from "./constants";
import { levelToTrackOffset } from "./threshold-track-math";

interface ScaleTick {
  feet: number;
  /** Offset from the column top, matching where a threshold at this depth sits. */
  top: number;
  length: number;
  labelled: boolean;
}

/**
 * Every column is the same height and covers the same depth, so the ticks are
 * worked out once here rather than per column.
 *
 * Placed through `levelToTrackOffset`, the same mapping the threshold pointers
 * use — which is what makes a pointer read against the scale beside it. The
 * offsets are rounded so a 1px rule lands on a device pixel instead of being
 * smeared across two.
 */
const SCALE_TICKS: ScaleTick[] = Array.from(
  { length: WATER_LEVEL_MAX_FEET + 1 },
  (_, feet): ScaleTick => {
    const labelled = feet % LEVEL_SCALE_LABEL_STEP === 0;
    return {
      feet,
      top: Math.round(levelToTrackOffset(feet)),
      length: labelled
        ? LEVEL_SCALE_TICK_MAJOR
        : feet % LEVEL_SCALE_MID_STEP === 0
          ? LEVEL_SCALE_TICK_MID
          : LEVEL_SCALE_TICK_MINOR,
      labelled,
    };
  },
);

/**
 * The foot scale beside a gauge: one tick per foot — one per LED — with every
 * fifth foot longer and every tenth labelled. It states what the LEDs are
 * counting, so a level or a threshold can be read off the column as a depth
 * without counting segments.
 *
 * Decorative: the depths it marks are already carried by the sliders' own
 * accessible values and by the readouts under each column.
 */
export function LevelScale() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
        width: LEVEL_SCALE_WIDTH,
        height: LED_COLUMN_HEIGHT,
        flexShrink: 0,
      }}
    >
      {SCALE_TICKS.map((tick) => (
        <Box key={tick.feet}>
          <Box
            sx={{
              position: "absolute",
              top: tick.top,
              left: 0,
              width: tick.length,
              height: "1px",
              bgcolor: tick.labelled
                ? PumpMonitoringPalette.text
                : PumpMonitoringPalette.textMuted,
              opacity: tick.labelled ? 0.55 : 0.35,
            }}
          />
          {tick.labelled && (
            <Typography
              sx={{
                position: "absolute",
                // Reads against its own tick, so it is centred on the depth it
                // names rather than hanging below it.
                top: tick.top,
                left: LEVEL_SCALE_TICK_MAJOR + 3,
                transform: "translateY(-50%)",
                fontSize: 9,
                fontWeight: 600,
                lineHeight: 1,
                color: PumpMonitoringPalette.textMuted,
              }}
            >
              {tick.feet}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}

/**
 * A gauge with its foot scale to the right, and a gutter of the scale's width
 * to the left.
 *
 * That gutter is doing the work: without it the scale would push the LEDs off
 * the centre of their grid column, out from under the switch, number and
 * status pill that name them. Balanced, the assembly's centre line is the
 * gauge's own, so the column reads as one stack — and the readouts underneath
 * centre on the LEDs rather than on the scale.
 *
 * It is blank on a pump column, which has nothing to put there. The water
 * column passes its vertical title as `gutter`, so the counterweight is
 * something worth reading and the title sits against its gauge instead of a
 * scale's width away from it.
 *
 * `children` are drawn in the gauge box, which is the positioning context for
 * the LED shell, the threshold pointers and the pending overlay alike.
 */
export function GaugeWithScale({
  children,
  gutter,
}: {
  children: ReactNode;
  gutter?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: `${LEVEL_SCALE_GAP}px`,
      }}
    >
      <Box
        sx={{
          width: LEVEL_SCALE_WIDTH,
          height: LED_COLUMN_HEIGHT,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {gutter}
      </Box>
      <Box
        sx={{
          position: "relative",
          width: LED_COLUMN_WIDTH,
          height: LED_COLUMN_HEIGHT,
          flexShrink: 0,
        }}
      >
        {children}
      </Box>
      <LevelScale />
    </Box>
  );
}
