"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { COL_GAP, ScalePalette } from "./constants";
import { getDashboardLayout } from "./dashboard-layout";
import { ScaleRow } from "./scale-row";
import type { ScaleReading } from "./types";

interface ScaleSectionProps {
  scale: ScaleReading;
  /** The shift the device reports as current, named in the production header. */
  shiftNumber: number;
}

/**
 * The connected scale's live readings, under the table's column headers.
 * Sizes itself to the space it is given: columns stretch to fill it, the table
 * scrolls sideways when it can't fit, and phones get a stacked card instead.
 */
export function ScaleSection({ scale, shiftNumber }: ScaleSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setAvailableWidth((current) => (current === width ? current : width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Nothing is drawn until the first measurement, so the table never flashes
  // at a width it doesn't have.
  const layout = availableWidth > 0 ? getDashboardLayout(availableWidth) : null;

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      {layout ? (
        <div className={layout.scrollEnabled ? "overflow-x-auto" : undefined} style={{ width: "100%" }}>
          <div style={{ ...sectionStyle, width: layout.scrollEnabled ? layout.contentWidth : "100%" }}>
            {!layout.stacked ? (
              <div style={headerStyle}>
                {/* Indented past the row's status dot so it lines up with the scale name. */}
                <div style={{ flexShrink: 0, width: layout.columns.name, paddingLeft: 20 }}>
                  <span style={headerTextStyle}>Scale Name</span>
                </div>
                <div style={{ flexShrink: 0, width: layout.columns.readings }}>
                  <div style={headerMetricsStyle}>
                    <span style={headerTextStyle}>Rate (ton / hr)</span>
                    <span style={headerTextStyle}>Belt Speed (ft / min)</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0, width: layout.columns.goal, textAlign: "center" }}>
                  <span style={headerTextStyle}>Daily Goal</span>
                </div>
                <div style={{ flexShrink: 0, width: layout.columns.production, textAlign: "center" }}>
                  <span style={headerTextStyle}>Shift [{shiftNumber}] Production (Ton)</span>
                </div>
                {/* Flex-centred so the label stays centred over the icon even though it is wider than the column. */}
                <div style={{ flexShrink: 0, width: layout.columns.notes, display: "flex", justifyContent: "center" }}>
                  <span style={{ ...headerTextStyle, whiteSpace: "nowrap" }}>Get Report</span>
                </div>
              </div>
            ) : null}

            <ScaleRow scale={scale} layout={layout} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

const sectionStyle: CSSProperties = {
  border: `1px solid ${ScalePalette.border}`,
  borderRadius: 4,
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-end",
  gap: COL_GAP,
  backgroundColor: ScalePalette.headerBg,
  borderBottom: `1px solid ${ScalePalette.border}`,
  padding: 12,
};

const headerMetricsStyle: CSSProperties = { display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 32 };
const headerTextStyle: CSSProperties = { color: ScalePalette.textMuted, fontSize: 11, fontWeight: 600, lineHeight: "16px" };
