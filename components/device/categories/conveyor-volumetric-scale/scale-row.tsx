"use client";

import type { CSSProperties } from "react";
import { COL_GAP, ROW_HEIGHT, ScalePalette } from "./constants";
import { GoalGauge } from "./goal-gauge";
import type { ScaleDashboardLayout } from "./dashboard-layout";
import { ScaleStatusBar } from "./scale-status-bar";
import type { ScaleReading } from "./types";
import DescriptionIcon from "@mui/icons-material/Description";

interface ScaleRowProps {
  scale: ScaleReading;
  layout: ScaleDashboardLayout;
}

function formatRate(value: number | undefined): string {
  if (value == null) return "—";
  return value.toFixed(1);
}

function formatProduction(value: number | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

export function ScaleRow({ scale, layout }: ScaleRowProps) {
  const isOffline = scale.state === "offline";
  const rowBg = ScalePalette.rowBg;
  const { columns, contentWidth, scrollEnabled, stacked } = layout;

  if (stacked) {
    return (
      <div style={{ ...stackedCardStyle, backgroundColor: rowBg }}>
        <div style={stackedHeaderStyle}>
          <span style={{ ...statusDotStyle, ...(isOffline ? { backgroundColor: ScalePalette.segmentInactive } : {}) }} />
          <div style={nameBlockStyle}>
            <p style={scaleNameStyle}>{scale.name}</p>
            {scale.subtitle ? <p style={scaleSubtitleStyle}>{scale.subtitle}</p> : null}
          </div>
        </div>

        {isOffline ? (
          <ScaleStatusBar state={scale.state} />
        ) : (
          <>
            <div style={metricsRowStyle}>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>RATE</span>
                <p style={metricValueStyle}>{formatRate(scale.rateTonPerHr)}</p>
                <span style={metricUnitStyle}>ton / hr</span>
              </div>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>SPEED</span>
                <p style={metricValueStyle}>{formatRate(scale.beltSpeedFtPerMin)}</p>
                <span style={metricUnitStyle}>ft / min</span>
              </div>
            </div>
            <ScaleStatusBar state={scale.state} />
          </>
        )}

        {!isOffline ? (
          <div style={stackedBottomRowStyle}>
            {scale.dailyGoalPercent != null ? <GoalGauge percent={scale.dailyGoalPercent} size={52} /> : null}
            <div style={productionColStyle}>
              <div style={productionBlockStyle}>
                <span style={productionLabelStyle}>DAILY</span>
                <p style={productionValueStyle}>{formatProduction(scale.dailyProductionTon)}</p>
              </div>
              <div style={productionBlockStyle}>
                <span style={productionLabelStyle}>SHIFT</span>
                <p style={productionValueStyle}>{formatProduction(scale.shiftProductionTon)}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div style={stackedFooterStyle}>
          <button type="button" style={notesButtonStyle} aria-label={`Notes for ${scale.name}`}>
            <DescriptionIcon sx={{ fontSize: 22 }} htmlColor={ScalePalette.notesIcon} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...rowStyle,
        backgroundColor: rowBg,
        ...(scrollEnabled ? { width: contentWidth } : { width: "100%" }),
      }}
    >
      <div style={{ ...nameColStyle, width: columns.name }}>
        <span style={{ ...statusDotStyle, ...(isOffline ? { backgroundColor: ScalePalette.segmentInactive } : {}) }} />
        <div style={nameBlockStyle}>
          <p style={scaleNameStyle}>{scale.name}</p>
          {scale.subtitle ? <p style={scaleSubtitleStyle}>{scale.subtitle}</p> : null}
        </div>
      </div>

      <div style={{ ...readingsColStyle, width: columns.readings }}>
        {isOffline ? (
          <ScaleStatusBar state={scale.state} />
        ) : (
          <>
            <div style={metricsRowStyle}>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>RATE</span>
                <p style={metricValueStyle}>{formatRate(scale.rateTonPerHr)}</p>
                <span style={metricUnitStyle}>ton / hr</span>
              </div>
              <div style={metricStyle}>
                <span style={metricLabelStyle}>SPEED</span>
                <p style={metricValueStyle}>{formatRate(scale.beltSpeedFtPerMin)}</p>
                <span style={metricUnitStyle}>ft / min</span>
              </div>
            </div>
            <ScaleStatusBar state={scale.state} />
          </>
        )}
      </div>

      <div style={{ ...goalColStyle, width: columns.goal }}>
        {!isOffline && scale.dailyGoalPercent != null ? (
          <GoalGauge percent={scale.dailyGoalPercent} />
        ) : (
          <div style={{ width: 64, height: 64 }} />
        )}
      </div>

      <div style={{ ...productionColStyle, width: columns.production }}>
        {!isOffline ? (
          <>
            <div style={productionBlockStyle}>
              <span style={productionLabelStyle}>DAILY</span>
              <p style={productionValueStyle}>{formatProduction(scale.dailyProductionTon)}</p>
            </div>
            <div style={productionBlockStyle}>
              <span style={productionLabelStyle}>SHIFT</span>
              <p style={productionValueStyle}>{formatProduction(scale.shiftProductionTon)}</p>
            </div>
          </>
        ) : null}
      </div>

      <div style={{ ...notesColStyle, width: columns.notes }}>
        <button type="button" style={notesButtonStyle} aria-label={`Notes for ${scale.name}`}>
          <DescriptionIcon sx={{ fontSize: 22 }} htmlColor={ScalePalette.notesIcon} />
        </button>
      </div>
    </div>
  );
}

const rowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  minHeight: ROW_HEIGHT,
  gap: COL_GAP,
  borderBottom: `1px solid ${ScalePalette.borderMuted}`,
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 12,
  paddingRight: 12,
};

const nameColStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  flexShrink: 0,
};

const statusDotStyle: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: ScalePalette.onlineDot,
  flexShrink: 0,
};

const nameBlockStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: 0,
};

const scaleNameStyle: CSSProperties = { color: ScalePalette.text, fontSize: 16, fontWeight: 700, margin: 0 };
const scaleSubtitleStyle: CSSProperties = { color: ScalePalette.textMuted, fontSize: 12, marginTop: 2 };

const readingsColStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 };
const metricsRowStyle: CSSProperties = { display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 32 };
const metricStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 2, minWidth: 72 };
const metricLabelStyle: CSSProperties = { color: ScalePalette.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: 0.4 };
const metricValueStyle: CSSProperties = { color: ScalePalette.text, fontSize: 18, fontWeight: 700, margin: 0 };
const metricUnitStyle: CSSProperties = { color: ScalePalette.textMuted, fontSize: 10 };

const goalColStyle: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };

const productionColStyle: CSSProperties = { display: "flex", flexDirection: "row", gap: 24, justifyContent: "center", flexShrink: 0 };
const productionBlockStyle: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 56 };
const productionLabelStyle: CSSProperties = { color: ScalePalette.textMuted, fontSize: 10, fontWeight: 600, letterSpacing: 0.4 };
const productionValueStyle: CSSProperties = { color: ScalePalette.text, fontSize: 15, fontWeight: 700, margin: 0 };

const notesColStyle: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const notesButtonStyle: CSSProperties = { padding: 4 };

// Stacked (mobile) card layout — same data, arranged vertically instead of as table columns.
const stackedCardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  borderBottom: `1px solid ${ScalePalette.borderMuted}`,
  padding: 12,
};

const stackedHeaderStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
};

const stackedBottomRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
};

const stackedFooterStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: 8,
};
