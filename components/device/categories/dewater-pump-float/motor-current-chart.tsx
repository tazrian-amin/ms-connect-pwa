"use client";

import { useCallback, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { BarChart } from "@mui/x-charts/BarChart";
import { ChartsReferenceLine } from "@mui/x-charts/ChartsReferenceLine";

import type { AdcSample } from "@/types/bluetooth";
import { MOTOR_CURRENT_MAX_AMPS, PumpMonitoringPalette } from "./constants";

interface MotorCurrentChartProps {
  samples: AdcSample[];
  /** The device's alarm band, drawn across the plot. */
  maxThreshold: number;
  minThreshold: number;
}

const CHART_HEIGHT = 300;

/**
 * Samples kept on the plot. Deliberately fewer than the water level chart's:
 * a bar needs width to be a bar at all, and past this the bars thin to lines
 * and the chart stops saying what it was chosen to say.
 */
const MAX_CHART_BARS = 40;

/**
 * Bars rather than a line, because each sample is an *instantaneous* current —
 * a reading taken at one moment, with nothing measured between it and the next.
 * A line would draw the stretch between two samples as a smooth ramp the motor
 * may never have travelled: a pump that started and stopped inside one interval
 * would show as a gentle rise. A bar claims only its own moment and leaves the
 * gaps as gaps, which is the honest reading of a periodic sample.
 *
 * It also suits what the reader is after here. Water level is a slow, continuous
 * depth and reads as a trend line; motor current is near-binary in practice —
 * off, or drawing its running load — so the eye wants to compare heights and
 * spot the one bar that overshot, not follow a curve.
 */
export function MotorCurrentChart({
  samples,
  maxThreshold,
  minThreshold,
}: MotorCurrentChartProps) {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setWidth((current) =>
        Math.abs(current - nextWidth) > 0.5 ? nextWidth : current,
      );
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // The newest run of samples, not a decimation of the whole history: bars are
  // read individually, so dropping some of them would misstate the record. The
  // long view is the water chart's job; this one shows what the motor is doing
  // now.
  const displaySamples = samples.slice(-MAX_CHART_BARS);
  const hasSamples = displaySamples.length > 0;
  const latest = hasSamples
    ? displaySamples[displaySamples.length - 1].value
    : null;

  const labels = displaySamples.map((sample) =>
    sample.timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          sx={{
            alignItems: "baseline",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Motor Current Telemetry
          </Typography>
          {/* The latest sample, spelled out: the bars carry the shape of the
              last few minutes, and this is the one figure a reader glancing at
              the card actually wants. */}
          <Typography
            sx={{
              color: PumpMonitoringPalette.currentActive,
              fontSize: 20,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {latest === null ? "—" : `${latest} A`}
          </Typography>
        </Stack>

        <Box
          ref={containerRef}
          sx={{ position: "relative", width: "100%", height: CHART_HEIGHT }}
        >
          {width > 0 && (
            <BarChart
              width={width}
              height={CHART_HEIGHT}
              series={[
                {
                  id: "motor-current",
                  data: displaySamples.map((sample) => sample.value),
                  label: "Motor Current (Arms)",
                  color: PumpMonitoringPalette.currentActive,
                  valueFormatter: (value: number | null) =>
                    value === null ? "" : `${value} A`,
                },
              ]}
              xAxis={[{ scaleType: "band", data: labels, height: 28 }]}
              yAxis={[
                {
                  width: 56,
                  min: 0,
                  max: MOTOR_CURRENT_MAX_AMPS,
                  valueFormatter: (value: number) => `${value} A`,
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ right: 24 }}
              borderRadius={4}
              skipAnimation
            >
              {/* Drawn as reference lines rather than as flat series: bars and a
                  line series share no shape, so a threshold has to be a rule
                  across the plot rather than a fourth thing in the legend. */}
              <ChartsReferenceLine
                y={maxThreshold}
                label={`Max ${maxThreshold} A`}
                labelAlign="end"
                lineStyle={{
                  stroke: PumpMonitoringPalette.redActive,
                  strokeDasharray: "6 4",
                }}
                labelStyle={{
                  fill: PumpMonitoringPalette.redActive,
                  fontSize: 11,
                }}
              />
              <ChartsReferenceLine
                y={minThreshold}
                label={`Min ${minThreshold} A`}
                labelAlign="end"
                lineStyle={{
                  stroke: PumpMonitoringPalette.amberActive,
                  strokeDasharray: "6 4",
                }}
                labelStyle={{
                  fill: PumpMonitoringPalette.amberActive,
                  fontSize: 11,
                }}
              />
            </BarChart>
          )}

          {!hasSamples && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                px: 2,
                pointerEvents: "none",
              }}
            >
              Waiting for motor current readings from the device...
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
