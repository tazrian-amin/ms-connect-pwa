"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { RateGraphChart } from "./rate-graph-chart";
import { RateGraphCustomFilters } from "./rate-graph-custom-filters";
import { generateRateGraphSeries } from "./rate-graph-demo-data";
import { RateGraphToolbar } from "./rate-graph-toolbar";
import type { RateGraphLocationContext, RateGraphPreset, RateGraphQuery, RateGraphScaleContext } from "./types";
import { createDefaultCustomQuery, createPresetQuery } from "./rate-graph-utils";

interface RateGraphViewProps {
  scale: RateGraphScaleContext;
  location: RateGraphLocationContext;
}

function buildSeries(scale: RateGraphScaleContext, location: RateGraphLocationContext, query: RateGraphQuery) {
  return generateRateGraphSeries(
    scale.scaleId,
    query,
    location.shiftSchedules,
    scale.lowProductionLimit,
    scale.highProductionLimit,
    scale.targetProductionRate,
  );
}

export function RateGraphView({ scale, location }: RateGraphViewProps) {
  const [query, setQuery] = useState<RateGraphQuery>(() => createPresetQuery("2-days"));
  const [showCustomPanel, setShowCustomPanel] = useState(false);
  const [customDraft, setCustomDraft] = useState<RateGraphQuery>(() => createDefaultCustomQuery());
  const [chartKey, setChartKey] = useState(0);

  const points = useMemo(() => buildSeries(scale, location, query), [scale, location, query]);

  const handlePresetChange = useCallback(
    (preset: RateGraphPreset) => {
      if (preset === "custom") {
        setCustomDraft(query.preset === "custom" ? query : createDefaultCustomQuery());
        setShowCustomPanel(true);
        return;
      }

      setShowCustomPanel(false);
      setQuery(createPresetQuery(preset));
    },
    [query],
  );

  const handleCustomApply = useCallback((nextQuery: RateGraphQuery) => {
    setQuery(nextQuery);
    setCustomDraft(nextQuery);
    setShowCustomPanel(false);
    setChartKey((value) => value + 1);
  }, []);

  const handleCustomCancel = useCallback(() => {
    setShowCustomPanel(false);
    if (query.preset !== "custom") return;
    setCustomDraft(query);
  }, [query]);

  return (
    <div style={containerStyle}>
      <RateGraphToolbar activePreset={showCustomPanel ? "custom" : query.preset} onPresetChange={handlePresetChange} />

      {showCustomPanel ? (
        <RateGraphCustomFilters
          query={customDraft}
          shiftSchedules={location.shiftSchedules}
          onApply={handleCustomApply}
          onCancel={handleCustomCancel}
        />
      ) : null}

      <RateGraphChart key={chartKey} points={points} />
    </div>
  );
}

const containerStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 16 };
