"use client";

import { useCallback, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import type { AdcSample } from "@/types/bluetooth";

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
}

const CHART_HEIGHT = 300;
const MAX_CHART_POINTS = 100;

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
    samples.length > 0 ? samples.reduce((sum, s) => sum + s.value, 0) / samples.length : null;

  const displaySamples = downsampleMinMax(samples, MAX_CHART_POINTS);
  const xLabels = displaySamples.map((sample) =>
    sample.timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );
  const values = displaySamples.map((sample) => sample.value);

  const formatValue = (value: number | null) =>
    value === null ? "" : `${value}${unit ?? ""}`;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          {title}
        </Typography>

        {samples.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        ) : (
          <Box ref={containerRef} sx={{ width: "100%", height: CHART_HEIGHT }}>
            {width > 0 && (
              <LineChart
                width={width}
                height={CHART_HEIGHT}
                series={[
                  { id: "raw", data: values, label: seriesLabel, valueFormatter: formatValue },
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
                ]}
                xAxis={[{ scaleType: "point", data: xLabels, height: 28 }]}
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
                  "& path[data-series='average']": {
                    strokeDasharray: "6 4",
                  },
                }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
