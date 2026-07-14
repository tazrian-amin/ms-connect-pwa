import type { ComponentType } from "react";
import type { DeviceCategoryId } from "@/types/bluetooth";
import { DischargeWaterFlowDetails } from "./discharge-water-flow";
import { DewaterWaterLevelDetails } from "./dewater-water-level";
import { DewaterPumpFloatDetails } from "./dewater-pump-float";
import { ConveyorVolumetricScaleDetails } from "./conveyor-volumetric-scale";
import { ConveyorVolumetricScaleProDetails } from "./conveyor-volumetric-scale-pro";
import { BinHeightMeasurementDetails } from "./bin-height-measurement";

export interface CategoryDetailsProps {
  isConnected: boolean;
}

export const CATEGORY_DETAILS: Record<DeviceCategoryId, ComponentType<CategoryDetailsProps>> = {
  "discharge-water-flow": DischargeWaterFlowDetails,
  "dewater-water-level": DewaterWaterLevelDetails,
  "dewater-pump-float": DewaterPumpFloatDetails,
  "conveyor-volumetric-scale": ConveyorVolumetricScaleDetails,
  "conveyor-volumetric-scale-pro": ConveyorVolumetricScaleProDetails,
  "bin-height-measurement": BinHeightMeasurementDetails,
};
