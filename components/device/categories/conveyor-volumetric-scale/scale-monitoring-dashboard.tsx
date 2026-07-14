"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import { createDemoScaleMonitoringData } from "./demo-data";
import { LocationSection } from "./location-section";
import { ScaleDashboardLayoutProvider, useScaleDashboardLayout } from "./scale-dashboard-layout-context";
import { ScalePalette } from "./constants";
import type { ScaleLocation, ScaleMonitoringData, ScaleReading } from "./types";
import { SortableList } from "./sortable-list";
import { getRateGraphLocationContext, getRateGraphScaleContext } from "./rate-graph/rate-graph-demo-data";
import { RateGraphView } from "./rate-graph/rate-graph-view";

interface ScaleMonitoringDashboardProps {
  data?: ScaleMonitoringData;
}

function ScaleDashboardBody({ children }: { children: React.ReactNode }) {
  const { scrollEnabled, contentWidth } = useScaleDashboardLayout();

  if (scrollEnabled) {
    return (
      <div className="overflow-x-auto" style={horizontalScrollStyle}>
        <div style={{ width: contentWidth }}>{children}</div>
      </div>
    );
  }

  return <div style={{ width: "100%" }}>{children}</div>;
}

function LocationDraggableList({
  locations,
  onLocationsChange,
  onScalesChange,
  onLocationUpdate,
  locationOptions,
  onOpenRateGraph,
}: {
  locations: ScaleLocation[];
  onLocationsChange: (locations: ScaleLocation[]) => void;
  onScalesChange: (locationId: string, scales: ScaleReading[]) => void;
  onLocationUpdate: (location: ScaleLocation) => void;
  locationOptions: { id: string; name: string }[];
  onOpenRateGraph: (scaleId: string, locationId: string) => void;
}) {
  return (
    <SortableList
      items={locations}
      keyExtractor={(location) => location.id}
      onReorder={onLocationsChange}
      renderItem={(location, index, dragHandleProps, isDragging) => (
        <LocationSection
          location={location}
          dragHandleProps={dragHandleProps}
          isDragging={isDragging}
          onScalesChange={onScalesChange}
          onLocationUpdate={onLocationUpdate}
          locationOptions={locationOptions}
          onOpenRateGraph={onOpenRateGraph}
        />
      )}
    />
  );
}

export function ScaleMonitoringDashboard({ data: dataProp }: ScaleMonitoringDashboardProps) {
  const [data, setData] = useState<ScaleMonitoringData>(() => dataProp ?? createDemoScaleMonitoringData());
  const [prevDataProp, setPrevDataProp] = useState(dataProp);
  const [availableWidth, setAvailableWidth] = useState(0);
  const [rateGraphTarget, setRateGraphTarget] = useState<{ scaleId: string; locationId: string } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (dataProp !== prevDataProp) {
    setPrevDataProp(dataProp);
    if (dataProp != null) {
      setData(dataProp);
    }
  }

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setAvailableWidth((current) => (current === width ? current : width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleLocationsChange = useCallback((locations: ScaleLocation[]) => {
    setData((prev) => ({ ...prev, locations }));
  }, []);

  const handleScalesChange = useCallback((locationId: string, scales: ScaleReading[]) => {
    setData((prev) => ({
      ...prev,
      locations: prev.locations.map((location) => (location.id === locationId ? { ...location, scales } : location)),
    }));
  }, []);

  const handleLocationUpdate = useCallback((updatedLocation: ScaleLocation) => {
    setData((prev) => ({
      ...prev,
      locations: prev.locations.map((location) => (location.id === updatedLocation.id ? updatedLocation : location)),
    }));
  }, []);

  const handleOpenRateGraph = useCallback((scaleId: string, locationId: string) => {
    setRateGraphTarget({ scaleId, locationId });
  }, []);

  const locationOptions = useMemo(
    () => data.locations.map((location) => ({ id: location.id, name: location.name })),
    [data.locations],
  );

  const rateGraphContext = useMemo(() => {
    if (!rateGraphTarget) return null;
    const location = getRateGraphLocationContext(rateGraphTarget.locationId);
    const scale = getRateGraphScaleContext(rateGraphTarget.scaleId, rateGraphTarget.locationId);
    if (!location || !scale) return null;
    return { location, scale };
  }, [rateGraphTarget]);

  return (
    <div style={rootStyle}>
      <p style={subheadingStyle}>
        Current readings from all scales reporting to this device. Values update once per minute for a near real-time
        view of production.
      </p>

      <div style={panelStyle}>
        <div ref={panelRef} style={{ width: "100%" }}>
          {availableWidth > 0 ? (
            <ScaleDashboardLayoutProvider availableWidth={availableWidth}>
              <ScaleDashboardBody>
                <LocationDraggableList
                  locations={data.locations}
                  onLocationsChange={handleLocationsChange}
                  onScalesChange={handleScalesChange}
                  onLocationUpdate={handleLocationUpdate}
                  locationOptions={locationOptions}
                  onOpenRateGraph={handleOpenRateGraph}
                />
              </ScaleDashboardBody>
            </ScaleDashboardLayoutProvider>
          ) : null}
        </div>
      </div>

      <Dialog
        open={rateGraphContext != null}
        onClose={() => setRateGraphTarget(null)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="h6" component="span" noWrap>
              {rateGraphContext?.scale.scaleName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {rateGraphContext?.location.locationName}
            </Typography>
          </Stack>
          <IconButton onClick={() => setRateGraphTarget(null)} aria-label="Close rate graph" size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {rateGraphContext ? <RateGraphView scale={rateGraphContext.scale} location={rateGraphContext.location} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const rootStyle: CSSProperties = { display: "flex", flexDirection: "column" };

const subheadingStyle: CSSProperties = { color: ScalePalette.textMuted, fontSize: 15, lineHeight: "22px", marginBottom: 16, marginTop: 0 };

const panelStyle: CSSProperties = {
  backgroundColor: ScalePalette.panelBg,
  border: `1px solid ${ScalePalette.border}`,
  borderRadius: 20,
  padding: 16,
  boxShadow: "0 2px 8px rgba(15, 23, 42, 0.06)",
};

const horizontalScrollStyle: CSSProperties = { width: "100%" };
