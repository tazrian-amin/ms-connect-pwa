"use client";

import { useCallback } from "react";
import { ScaleRow } from "./scale-row";
import { SortableList } from "./sortable-list";
import type { ScaleReading } from "./types";

interface ScaleRowListProps {
  scales: ScaleReading[];
  onScalesChange: (scales: ScaleReading[]) => void;
  onDragActiveChange?: (active: boolean) => void;
  locationOptions: { id: string; name: string }[];
  currentLocationId: string;
  onOpenRateGraph: (scaleId: string, locationId: string) => void;
}

export function ScaleRowList({
  scales,
  onScalesChange,
  onDragActiveChange,
  locationOptions,
  currentLocationId,
  onOpenRateGraph,
}: ScaleRowListProps) {
  const handleScaleUpdate = useCallback(
    (updatedScale: ScaleReading) => {
      onScalesChange(scales.map((scale) => (scale.id === updatedScale.id ? updatedScale : scale)));
    },
    [onScalesChange, scales],
  );

  return (
    <SortableList
      items={scales}
      keyExtractor={(scale) => scale.id}
      onReorder={onScalesChange}
      onDragActiveChange={onDragActiveChange}
      renderItem={(scale, index, dragHandleProps, isDragging) => (
        <ScaleRow
          scale={scale}
          rowIndex={index}
          dragHandleProps={dragHandleProps}
          isDragging={isDragging}
          locationOptions={locationOptions}
          currentLocationId={currentLocationId}
          onScaleUpdate={handleScaleUpdate}
          onOpenRateGraph={onOpenRateGraph}
        />
      )}
    />
  );
}
