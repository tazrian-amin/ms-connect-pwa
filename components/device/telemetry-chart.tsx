"use client";

import { useCallback, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import type { AdcSample } from "@/types/bluetooth";

/** A horizontal marker drawn across the plot, e.g. a trigger threshold. */
export interface TelemetryReferenceLine {
  /** Position on the y-axis, in the same units as the samples. */
  value: number;
  /** Legend label; the level itself is only shown in the tooltip. */
  label: string;
  color: string;
}

interface TelemetryChartProps {
  samples: AdcSample[];
  /** Card heading. Defaults to the raw-ADC telemetry wording. */
  title?: string;
  /** Legend label for the plotted series. */
  seriesLabel?: string;
  /** Shown while no samples have arrived yet. */
  emptyMessage?: string;
  /** Unit suffix appended to values in the y-axis ticks and tooltip (e.g. "%"). */
  unit?: string;
  /** Fixes the y-axis to a known range (e.g. [0, 100] for a percentage). */
  yDomain?: [number, number];
  /** Threshold markers drawn across the plot. */
  referenceLines?: TelemetryReferenceLine[];
  /** Dashed mean-of-all-samples series; drop it where it only adds clutter. */
  showAverage?: boolean;
}

const CHART_HEIGHT = 300;
const MAX_CHART_POINTS = 100;

/**
 * Stand-in x-axis used before the first sample arrives, so the chart can still
 * draw its frame (axes, grid, thresholds). Two points because the reference
 * lines need somewhere to start and end; their tick labels are blanked out.
 */
const PLACEHOLDER_X_AXIS = [0, 1];

/**
 * Downsamples to at most `maxPoints` by taking the min and max of each
 * bucket (in chronological order), so spikes/dips stay visible instead of
 * being smoothed away like plain stride decimation would.
 */
function downsampleMinMax(samples: AdcSample[], maxPoints: number): AdcSample[] {
  if (samples.length <= maxPoints) return samples;

  const bucketCount = Math.max(1, Math.floor(maxPoints / 2));
  const bucketSize = samples.length / bucketCount;
  const result: AdcSample[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const start = Math.floor(i * bucketSize);
    const end = Math.floor((i + 1) * bucketSize);
    const bucket = samples.slice(start, end);
    if (bucket.length === 0) continue;

    let min = bucket[0];
    let max = bucket[0];
    for (const sample of bucket) {
      if (sample.value < min.value) min = sample;
      if (sample.value > max.value) max = sample;
    }

    if (min === max) {
      result.push(min);
    } else if (min.timestamp.getTime() <= max.timestamp.getTime()) {
      result.push(min, max);
    } else {
      result.push(max, min);
    }
  }

  return result;
}

export function TelemetryChart({
  samples,
  title = "Live Telemetry",
  seriesLabel = "Raw ADC Value",
  emptyMessage = "Waiting for ADC readings from the device...",
  unit,
  yDomain,
  referenceLines = [],
  showAverage = true,
}: TelemetryChartProps) {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setWidth((current) => (Math.abs(current - nextWidth) > 0.5 ? nextWidth : current));
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // The average is computed from every sample, not just the ones plotted,
  // so downsampling for display never skews it.
  const average =
    showAverage && samples.length > 0
      ? samples.reduce((sum, s) => sum + s.value, 0) / samples.length
      : null;

  const hasSamples = samples.length > 0;
  const displaySamples = downsampleMinMax(samples, MAX_CHART_POINTS);
  const xLabels = displaySamples.map((sample) =>
    sample.timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );
  const values = displaySamples.map((sample) => sample.value);

  const xAxisData: (string | number)[] = hasSamples
    ? xLabels
    : PLACEHOLDER_X_AXIS;
  // All-null keeps the series (and its legend entry) in place while empty, so
  // the legend doesn't reshuffle once readings start arriving.
  const seriesData: (number | null)[] = hasSamples
    ? values
    : xAxisData.map(() => null);

  const formatValue = (value: number | null) =>
    value === null ? "" : `${value}${unit ?? ""}`;

  // Flat series rather than <ChartsReferenceLine>, so each threshold takes its
  // place in the legend alongside the plotted series instead of carrying its
  // own label across the plot.
  const referenceSeries = referenceLines.map((line, index) => ({
    id: `reference-${index}`,
    data: xAxisData.map(() => line.value),
    label: line.label,
    color: line.color,
    showMark: false,
    valueFormatter: formatValue,
  }));

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>

        <Box
          ref={containerRef}
          sx={{ position: "relative", width: "100%", height: CHART_HEIGHT }}
        >
          {width > 0 && (
            <LineChart
              width={width}
              height={CHART_HEIGHT}
              series={[
                { id: "raw", data: seriesData, label: seriesLabel, valueFormatter: formatValue },
                ...(average !== null
                  ? [
                      {
                        id: "average",
                        data: values.map(() => average),
                        label: "Average",
                        color: "#ef4444",
                        showMark: false,
                        valueFormatter: formatValue,
                      },
                    ]
                  : []),
                ...referenceSeries,
              ]}
              xAxis={[
                {
                  scaleType: "point",
                  data: xAxisData,
                  height: 28,
                  // The placeholder axis carries indices, not timestamps.
                  valueFormatter: hasSamples ? undefined : () => "",
                },
              ]}
              yAxis={[
                {
                  width: 50,
                  min: yDomain?.[0],
                  max: yDomain?.[1],
                  valueFormatter: unit ? (value: number) => `${value}${unit}` : undefined,
                },
              ]}
              grid={{ horizontal: true }}
              margin={{ right: 24 }}
              skipAnimation
              sx={{
                "& path[data-series='average'], & path[data-series^='reference-']": {
                  strokeDasharray: "6 4",
                },
              }}
            />
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
              {emptyMessage}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
