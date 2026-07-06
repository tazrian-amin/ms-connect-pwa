"use client";

import { useEffect, useRef } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AdcSample } from "@/types/bluetooth";
import { Card } from "@/components/ui/card";

// Horizontal spacing per point so the trace never looks congested.
const PIXELS_PER_POINT = 12;
// How close to the right edge counts as "already viewing the latest data".
const AUTO_SCROLL_THRESHOLD_PX = PIXELS_PER_POINT * 2;

interface TelemetryChartProps {
  samples: AdcSample[];
}

export function TelemetryChart({ samples }: TelemetryChartProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Tracks whether the user was viewing the latest data before this update,
  // so newly appended points don't yank the view away from a manual scroll-back.
  const isNearEndRef = useRef(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromEnd = el.scrollWidth - el.scrollLeft - el.clientWidth;
    isNearEndRef.current = distanceFromEnd < AUTO_SCROLL_THRESHOLD_PX;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isNearEndRef.current) {
      el.scrollLeft = el.scrollWidth;
    }
  }, [samples]);

  const data = samples.map((sample) => ({
    time: sample.timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    value: sample.value,
  }));

  const innerWidth = Math.max(data.length * PIXELS_PER_POINT, 320);

  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Live Telemetry
      </h2>

      {data.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Waiting for ADC readings from the device...
        </p>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-x-auto rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/50"
        >
          <div style={{ width: innerWidth, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  width={40}
                  domain={["auto", "auto"]}
                />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Raw ADC Value"
                  stroke="#28a745"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}
