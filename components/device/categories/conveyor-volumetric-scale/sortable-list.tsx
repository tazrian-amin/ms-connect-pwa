"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  ref: (element: HTMLElement | null) => void;
}

interface SortableListProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  onReorder: (items: T[]) => void;
  onDragActiveChange?: (active: boolean) => void;
  renderItem: (item: T, index: number, dragHandleProps: DragHandleProps, isDragging: boolean) => ReactNode;
}

function SortableItem<T>({
  id,
  item,
  index,
  renderItem,
}: {
  id: string;
  item: T;
  index: number;
  renderItem: SortableListProps<T>["renderItem"];
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: "relative",
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {renderItem(item, index, { attributes, listeners, ref: setActivatorNodeRef }, isDragging)}
    </div>
  );
}

/**
 * Reorderable list backed by dnd-kit (pointer + keyboard support, animated
 * reordering) instead of react-native-draggable-flatlist. `renderItem` gets
 * the drag handle's attributes/listeners/ref to spread onto whichever
 * element should act as the grab handle.
 */
export function SortableList<T>({
  items,
  keyExtractor,
  onReorder,
  onDragActiveChange,
  renderItem,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const ids = items.map(keyExtractor);

  const handleDragEnd = (event: DragEndEvent) => {
    onDragActiveChange?.(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={() => onDragActiveChange?.(true)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => onDragActiveChange?.(false)}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => (
          <SortableItem key={keyExtractor(item)} id={keyExtractor(item)} item={item} index={index} renderItem={renderItem} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
