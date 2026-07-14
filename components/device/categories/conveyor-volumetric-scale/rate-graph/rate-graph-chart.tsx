"use client";

import { useCallback, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import type { RateGraphDataPoint } from "./types";
import { formatGraphAxisLabel } from "./rate-graph-utils";

interface RateGraphChartProps {
  points: RateGraphDataPoint[];
}

const CHART_HEIGHT = 300;

export function RateGraphChart({ points }: RateGraphChartProps) {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  // Callback ref (not useEffect): the wrapping Box only mounts once points
  // exist, so a mount-only effect would miss it and the observer would
  // never attach.
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

  const xLabels = points.map((point) => formatGraphAxisLabel(point.timestamp).replace("\n", " "));
  const values = points.map((point) => point.rateTonPerHr);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Rate (ton / hr)
        </Typography>

        {points.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No data for the selected range and time filter.
          </Typography>
        ) : (
          <Box ref={containerRef} sx={{ width: "100%", height: CHART_HEIGHT }}>
            {width > 0 && (
              <LineChart
                width={width}
                height={CHART_HEIGHT}
                series={[{ id: "rate", data: values, label: "Rate (ton/hr)", showMark: points.length <= 80 }]}
                xAxis={[{ scaleType: "point", data: xLabels, height: 28 }]}
                yAxis={[{ width: 50 }]}
                grid={{ horizontal: true }}
                margin={{ right: 24 }}
                skipAnimation
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
