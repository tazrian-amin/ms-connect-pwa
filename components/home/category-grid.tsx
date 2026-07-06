"use client";

import Image from "next/image";
import { Card } from "@/components/ui/card";
import { DEVICE_CATEGORIES } from "@/lib/bluetooth/categories";
import { useBluetooth } from "@/context/bluetooth-provider";
import type { DeviceCategory } from "@/types/bluetooth";

interface CategoryGridProps {
  onCategorySelect?: (category: DeviceCategory) => void;
  selectable?: boolean;
}

export function CategoryGrid({
  onCategorySelect,
  selectable = false,
}: CategoryGridProps) {
  const { selectedCategory, setSelectedCategory } = useBluetooth();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {DEVICE_CATEGORIES.map((category) => {
        const isSelected = selectedCategory?.id === category.id;

        return (
          <Card
            key={category.id}
            selected={selectable && isSelected}
            onClick={
              selectable
                ? () => {
                    setSelectedCategory(category);
                    onCategorySelect?.(category);
                  }
                : undefined
            }
          >
            <div className="flex items-start gap-3">
              <Image
                src={category.image}
                alt=""
                width={48}
                height={48}
                className="shrink-0 rounded-lg"
                aria-hidden="true"
              />
              <div>
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  <span className="mr-1" aria-hidden="true">
                    {category.icon}
                  </span>
                  {category.name}
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {category.description}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
