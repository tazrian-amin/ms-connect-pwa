export type MaterialType = "dry" | "wet";

export const MATERIAL_TYPE_OPTIONS: { value: MaterialType; label: string }[] = [
  { value: "dry", label: "Dry" },
  { value: "wet", label: "Wet" },
];

export const DEFAULT_MATERIAL_TYPE: MaterialType = "dry";

/**
 * What the device was last sent. Density is held in lb/ft³ and belt speed in
 * ft/min whatever units are selected — see units.ts.
 */
export interface ConveyorSettings {
  materialType: MaterialType;
  density: number | null;
  beltSpeed: number | null;
}

export const DEFAULT_CONVEYOR_SETTINGS: ConveyorSettings = {
  materialType: DEFAULT_MATERIAL_TYPE,
  density: null,
  beltSpeed: null,
};
