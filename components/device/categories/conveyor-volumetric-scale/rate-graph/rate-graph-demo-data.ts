import { createDemoScaleMonitoringData } from "../demo-data";
import type {
  RateGraphDataPoint,
  RateGraphLocationContext,
  RateGraphQuery,
  RateGraphScaleContext,
} from "./types";
import {
  endOfDay,
  filterPointsByTimeMode,
  startOfDay,
} from "./rate-graph-utils";

const SAMPLE_INTERVAL_MS = 15 * 60 * 1000;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getRateGraphLocationContext(
  locationId: string,
): RateGraphLocationContext | null {
  const data = createDemoScaleMonitoringData();
  const location = data.locations.find((item) => item.id === locationId);
  if (!location) return null;
  return {
    locationId: location.id,
    locationName: location.name,
    shiftSchedules: location.shiftSchedules,
  };
}

export function getRateGraphScaleContext(
  scaleId: string,
  locationId: string,
): RateGraphScaleContext | null {
  const data = createDemoScaleMonitoringData();
  const location = data.locations.find((item) => item.id === locationId);
  const scale = location?.scales.find((item) => item.id === scaleId);
  if (!scale) return null;
  return {
    scaleId: scale.id,
    scaleName: scale.name,
    lowProductionLimit: scale.lowProductionLimit,
    highProductionLimit: scale.highProductionLimit,
    targetProductionRate: scale.targetProductionRate,
  };
}

function isRunningAt(seed: number, timestamp: number): boolean {
  const dayIndex = Math.floor(timestamp / (24 * 60 * 60 * 1000));
  const slot = Math.floor(
    (timestamp % (24 * 60 * 60 * 1000)) / SAMPLE_INTERVAL_MS,
  );
  const value = pseudoRandom(seed + dayIndex * 17 + slot * 3);
  if (value < 0.28) return false;
  if (value > 0.82) return false;
  return true;
}

function generateRawSeries(
  scaleId: string,
  query: RateGraphQuery,
  lowLimit: number,
  highLimit: number,
  targetRate: number,
): RateGraphDataPoint[] {
  const seed = hashString(scaleId);
  const startMs = startOfDay(query.startDate).getTime();
  const endMs = endOfDay(query.endDate).getTime();
  const points: RateGraphDataPoint[] = [];
  let cumulativeTotalTon = 0;

  for (let timestamp = startMs; timestamp <= endMs; timestamp += SAMPLE_INTERVAL_MS) {
    const running = isRunningAt(seed, timestamp);
    let rateTonPerHr = 0;
    let beltSpeedFtPerMin = 0;

    if (running) {
      const noise = pseudoRandom(seed + timestamp);
      const swing = pseudoRandom(seed + timestamp / 1000);
      rateTonPerHr =
        targetRate +
        (noise - 0.5) * (highLimit - lowLimit) * 0.55 +
        (swing - 0.5) * 80;
      rateTonPerHr = Math.max(
        lowLimit - 40,
        Math.min(highLimit + 60, rateTonPerHr),
      );
      beltSpeedFtPerMin = 180 + rateTonPerHr * 0.55 + (noise - 0.5) * 40;
    }

    cumulativeTotalTon += (rateTonPerHr * SAMPLE_INTERVAL_MS) / (60 * 60 * 1000);

    points.push({
      timestamp,
      rateTonPerHr: Number(rateTonPerHr.toFixed(1)),
      beltSpeedFtPerMin: Number(beltSpeedFtPerMin.toFixed(1)),
      cumulativeTotalTon: Math.round(cumulativeTotalTon),
    });
  }

  return points;
}

export function generateRateGraphSeries(
  scaleId: string,
  query: RateGraphQuery,
  shiftSchedules: RateGraphLocationContext["shiftSchedules"],
  lowLimit: number,
  highLimit: number,
  targetRate: number,
): RateGraphDataPoint[] {
  const raw = generateRawSeries(
    scaleId,
    query,
    lowLimit,
    highLimit,
    targetRate,
  );
  return filterPointsByTimeMode(raw, query, shiftSchedules);
}
