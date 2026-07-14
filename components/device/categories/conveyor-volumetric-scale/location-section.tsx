"use client";

import { useState, type CSSProperties } from "react";
import { EditLocationDialog } from "./edit-location-dialog";
import { GoalGauge } from "./goal-gauge";
import { ScaleRowList } from "./scale-row-list";
import { useScaleDashboardLayout } from "./scale-dashboard-layout-context";
import { COL_GAP, ScalePalette } from "./constants";
import type { ScaleLocation, ScaleReading } from "./types";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import SettingsIcon from "@mui/icons-material/Settings";
import type { DragHandleProps } from "./sortable-list";

const ICON_SIZE = 20;
const ACCORDION_ICON_SIZE = 28;

interface LocationSectionProps {
  location: ScaleLocation;
  dragHandleProps?: DragHandleProps;
  isDragging?: boolean;
  onScalesChange?: (locationId: string, scales: ScaleReading[]) => void;
  onScaleDragActiveChange?: (active: boolean) => void;
  onLocationUpdate?: (location: ScaleLocation) => void;
  locationOptions: { id: string; name: string }[];
  onOpenRateGraph: (scaleId: string, locationId: string) => void;
}

function formatRate(value: number): string {
  return value.toFixed(1);
}

function formatProduction(value: number): string {
  return value.toLocaleString("en-US");
}

export function LocationSection({
  location,
  dragHandleProps,
  isDragging = false,
  onScalesChange,
  onScaleDragActiveChange,
  onLocationUpdate,
  locationOptions,
  onOpenRateGraph,
}: LocationSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const { columns, contentWidth, scrollEnabled, stacked } = useScaleDashboardLayout();
  const sectionWidthStyle: CSSProperties = scrollEnabled ? { width: contentWidth } : { width: "100%" };

  return (
    <div style={{ ...sectionStyle, ...sectionWidthStyle, ...(isDragging ? sectionDraggingStyle : {}) }}>
      <div
        style={{
          ...sectionHeaderStyle,
          ...sectionWidthStyle,
          ...(!expanded ? { borderBottomWidth: 0 } : {}),
        }}
      >
        <div style={{ ...locationTitleRowStyle, ...(!expanded ? { marginBottom: 0 } : {}) }}>
          <button type="button" style={iconButtonStyle} aria-label={`Edit ${location.name} settings`} onClick={() => setEditVisible(true)}>
            <SettingsIcon sx={{ fontSize: ICON_SIZE }} htmlColor={ScalePalette.settingsIcon} />
          </button>
          <button
            type="button"
            ref={dragHandleProps?.ref}
            style={{ ...iconButtonStyle, cursor: "grab", touchAction: "none" }}
            aria-label={`Reorder ${location.name}`}
            {...dragHandleProps?.attributes}
            {...dragHandleProps?.listeners}
          >
            <OpenWithIcon sx={{ fontSize: ICON_SIZE }} htmlColor={ScalePalette.textMuted} />
          </button>
          <button
            type="button"
            aria-label={expanded ? `Collapse ${location.name}` : `Expand ${location.name}`}
            onClick={() => setExpanded((prev) => !prev)}
            style={iconButtonStyle}
          >
            {expanded ? (
              <ArrowDropUpIcon sx={{ fontSize: ACCORDION_ICON_SIZE }} htmlColor={ScalePalette.text} />
            ) : (
              <ArrowDropDownIcon sx={{ fontSize: ACCORDION_ICON_SIZE }} htmlColor={ScalePalette.text} />
            )}
          </button>
          <p style={locationNameStyle}>{location.name}</p>
        </div>

        {expanded && !stacked ? (
          <div style={columnHeadersStyle}>
            <div style={{ flexShrink: 0, width: columns.name }} />
            <div style={{ flexShrink: 0, width: columns.readings }}>
              <div style={headerMetricsStyle}>
                <span style={headerTextStyle}>Rate (ton / hr)</span>
                <span style={headerTextStyle}>Belt Speed (ft / min)</span>
              </div>
            </div>
            <div style={{ flexShrink: 0, width: columns.goal, textAlign: "center" }}>
              <span style={headerTextStyle}>Daily Goal</span>
            </div>
            <div style={{ flexShrink: 0, width: columns.production, textAlign: "center" }}>
              <span style={headerTextStyle}>Shift [{location.shiftNumber}] Production (Ton)</span>
            </div>
            <div style={{ width: columns.notes }} />
          </div>
        ) : null}
      </div>

      {expanded ? (
        <>
          <ScaleRowList
            scales={location.scales}
            onScalesChange={(scales) => onScalesChange?.(location.id, scales)}
            onDragActiveChange={onScaleDragActiveChange}
            locationOptions={locationOptions}
            currentLocationId={location.id}
            onOpenRateGraph={onOpenRateGraph}
          />

          {stacked ? (
            <div style={stackedTotalRowStyle}>
              <p style={totalLabelStyle}>Location Total</p>
              <div style={stackedTotalMetricsRowStyle}>
                <div>
                  <span style={totalMetricLabelStyle}>RATE</span>
                  <p style={totalMetricValueStyle}>{formatRate(location.total.rateTonPerHr)}</p>
                  <span style={totalMetricUnitStyle}>ton / hr</span>
                </div>
                <GoalGauge percent={location.total.dailyGoalPercent} variant="onDark" size={52} />
              </div>
              <div style={totalProductionColStyle}>
                <div style={totalProductionBlockStyle}>
                  <span style={totalProductionLabelStyle}>DAILY</span>
                  <p style={totalProductionValueStyle}>{formatProduction(location.total.dailyProductionTon)}</p>
                </div>
                <div style={totalProductionBlockStyle}>
                  <span style={totalProductionLabelStyle}>SHIFT</span>
                  <p style={totalProductionValueStyle}>{formatProduction(location.total.shiftProductionTon)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...totalRowStyle, ...(scrollEnabled ? { width: contentWidth } : { width: "100%" }) }}>
              <div style={{ flexShrink: 0, width: columns.name }}>
                <p style={totalLabelStyle}>Location Total</p>
              </div>
              <div style={{ ...totalReadingsColStyle, width: columns.readings }}>
                <span style={totalMetricLabelStyle}>RATE</span>
                <p style={totalMetricValueStyle}>{formatRate(location.total.rateTonPerHr)}</p>
                <span style={totalMetricUnitStyle}>ton / hr</span>
              </div>
              <div style={{ ...totalGoalColStyle, width: columns.goal }}>
                <GoalGauge percent={location.total.dailyGoalPercent} variant="onDark" />
              </div>
              <div style={{ ...totalProductionColStyle, width: columns.production }}>
                <div style={totalProductionBlockStyle}>
                  <span style={totalProductionLabelStyle}>DAILY</span>
                  <p style={totalProductionValueStyle}>{formatProduction(location.total.dailyProductionTon)}</p>
                </div>
                <div style={totalProductionBlockStyle}>
                  <span style={totalProductionLabelStyle}>SHIFT</span>
                  <p style={totalProductionValueStyle}>{formatProduction(location.total.shiftProductionTon)}</p>
                </div>
              </div>
              <div style={{ width: columns.notes }} />
            </div>
          )}
        </>
      ) : null}

      <EditLocationDialog
        visible={editVisible}
        location={location}
        onCancel={() => setEditVisible(false)}
        onSave={(updatedLocation) => {
          onLocationUpdate?.(updatedLocation);
          setEditVisible(false);
        }}
      />
    </div>
  );
}

const sectionStyle: CSSProperties = {
  border: `1px solid ${ScalePalette.border}`,
  borderRadius: 4,
  overflow: "hidden",
  marginBottom: 16,
};

const sectionDraggingStyle: CSSProperties = {
  boxShadow: "0 6px 10px rgba(17, 24, 39, 0.14)",
  position: "relative",
  zIndex: 1,
};

const sectionHeaderStyle: CSSProperties = {
  backgroundColor: ScalePalette.headerBg,
  borderBottomWidth: 1,
  borderBottomStyle: "solid",
  borderBottomColor: ScalePalette.border,
  paddingTop: 12,
  paddingBottom: 12,
  paddingLeft: 12,
  paddingRight: 12,
};

const locationTitleRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  marginBottom: 8,
};

const iconButtonStyle: CSSProperties = {
  minWidth: 44,
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const locationNameStyle: CSSProperties = { color: ScalePalette.text, fontSize: 16, fontWeight: 700, marginLeft: 2, margin: 0 };

const columnHeadersStyle: CSSProperties = { display: "flex", flexDirection: "row", alignItems: "flex-end", gap: COL_GAP };
const headerMetricsStyle: CSSProperties = { display: "flex", flexDirection: "row", justifyContent: "space-between", gap: 32 };
const headerTextStyle: CSSProperties = { color: ScalePalette.textMuted, fontSize: 11, fontWeight: 600, lineHeight: "16px" };

const totalRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: COL_GAP,
  backgroundColor: ScalePalette.totalRowBg,
  paddingTop: 14,
  paddingBottom: 14,
  paddingLeft: 12,
  paddingRight: 12,
};

const totalLabelStyle: CSSProperties = { color: ScalePalette.textLight, fontSize: 16, fontWeight: 700, margin: 0 };
const totalReadingsColStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 };
const totalMetricLabelStyle: CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 600, letterSpacing: 0.4 };
const totalMetricValueStyle: CSSProperties = { color: ScalePalette.textLight, fontSize: 18, fontWeight: 700, margin: 0 };
const totalMetricUnitStyle: CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: 9 };
const totalGoalColStyle: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const totalProductionColStyle: CSSProperties = { display: "flex", flexDirection: "row", gap: 24, justifyContent: "center", flexShrink: 0 };
const totalProductionBlockStyle: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 };
const totalProductionLabelStyle: CSSProperties = { color: "rgba(255,255,255,0.7)", fontSize: 9, fontWeight: 600, letterSpacing: 0.4 };
const totalProductionValueStyle: CSSProperties = { color: ScalePalette.textLight, fontSize: 14, fontWeight: 700, margin: 0 };

const stackedTotalRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  backgroundColor: ScalePalette.totalRowBg,
  padding: 12,
};

const stackedTotalMetricsRowStyle: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
};
