import { scaleLinear } from 'd3-scale';
import { HR_ZONE_DEFS, POWER_ZONE_DEFS } from '@/packages/engine/zoneDistribution.ts';
import { computeRunningZones } from '@/packages/engine/zones.ts';

export type ZoneMetric = 'hr' | 'power' | 'pace';

export interface ZoneThresholds {
  maxHr?: number;
  restHr?: number;
  ftp?: number;
  thresholdPace?: number;
}

export interface ZoneBand {
  zone: string;
  name: string;
  min: number;
  max: number;
  mid: number;
  color: string;
}

export interface ColorScale {
  domain: number[];
  colorAt: (value: number) => string;
}

export interface ZoneScale extends ColorScale {
  bands: ZoneBand[];
  bandAt: (value: number) => ZoneBand;
}

interface GradientStop {
  offset: number;
  color: string;
}

export const WIND_COLORS = {
  tail: '#34d399',
  cross: '#fbbf24',
  head: '#ef4444',
} as const;

const windBlend = scaleLinear<string>()
  .domain([22.5, 90, 157.5])
  .range([WIND_COLORS.head, WIND_COLORS.cross, WIND_COLORS.tail])
  .clamp(true);

export const windColorAt = (angle: number): string => windBlend(angle);

const OPEN_ZONE_SPAN = 0.5;

interface PctZoneDef {
  zone: string;
  name: string;
  minPct: number;
  maxPct: number;
  color: string;
}

const pctBands = (defs: readonly PctZoneDef[], toValue: (pct: number) => number): ZoneBand[] =>
  defs.map((def) => {
    let midMax = def.maxPct;
    if (!Number.isFinite(midMax)) {
      midMax = def.minPct + OPEN_ZONE_SPAN;
    }
    return {
      zone: def.zone,
      name: def.name,
      min: toValue(def.minPct),
      max: toValue(def.maxPct),
      mid: toValue((def.minPct + midMax) / 2),
      color: def.color,
    };
  });

const paceBands = (thresholdPaceSec: number): ZoneBand[] =>
  computeRunningZones(thresholdPaceSec).map((zone, i) => {
    const min = zone.maxPace / 60;
    const max = zone.minPace / 60;
    return {
      zone: `Z${i + 1}`,
      name: zone.name,
      min,
      max,
      mid: (min + max) / 2,
      color: zone.color,
    };
  });

export const ZONE_PALETTES: Record<ZoneMetric, string[]> = {
  hr: HR_ZONE_DEFS.map((def) => def.color),
  power: POWER_ZONE_DEFS.map((def) => def.color),
  pace: computeRunningZones(1).map((zone) => zone.color),
};

const bandsFor = (metric: ZoneMetric, thresholds: ZoneThresholds): ZoneBand[] | undefined => {
  if (metric === 'hr') {
    const maxHr = thresholds.maxHr;
    const restHr = thresholds.restHr;
    if (maxHr === undefined || restHr === undefined || maxHr <= restHr) return undefined;
    return pctBands(HR_ZONE_DEFS, (pct) => restHr + (maxHr - restHr) * pct);
  }
  if (metric === 'power') {
    const ftp = thresholds.ftp;
    if (ftp === undefined || ftp <= 0) return undefined;
    return pctBands(POWER_ZONE_DEFS, (pct) => ftp * pct);
  }
  const thresholdPace = thresholds.thresholdPace;
  if (thresholdPace === undefined || thresholdPace <= 0) return undefined;
  return paceBands(thresholdPace);
};

export const zoneScale = (
  metric: ZoneMetric,
  thresholds: ZoneThresholds,
): ZoneScale | undefined => {
  const unsorted = bandsFor(metric, thresholds);
  if (!unsorted) return undefined;
  const bands = [...unsorted].sort((a, b) => a.min - b.min);
  const blend = scaleLinear<string>()
    .domain(bands.map((band) => band.mid))
    .range(bands.map((band) => band.color))
    .clamp(true);
  const first = bands[0];
  const last = bands[bands.length - 1];
  if (!first || !last) return undefined;
  return {
    bands,
    domain: bands.map((band) => band.mid),
    colorAt: (value) => blend(value),
    bandAt: (value) => {
      if (value < first.min) return first;
      return bands.find((band) => value >= band.min && value < band.max) ?? last;
    },
  };
};

const zoneGradientStops = (
  scale: ColorScale,
  values: Array<number | null | undefined>,
  reversed: boolean,
): GradientStop[] | undefined => {
  const present = values.filter((v): v is number => v !== null && v !== undefined);
  if (present.length === 0) return undefined;
  const min = Math.min(...present);
  const max = Math.max(...present);
  if (max <= min) return undefined;
  const points = [min, ...scale.domain.filter((v) => v > min && v < max), max];
  const toOffset = (value: number) => {
    if (reversed) return (value - min) / (max - min);
    return (max - value) / (max - min);
  };
  return points
    .map((value) => ({ offset: toOffset(value), color: scale.colorAt(value) }))
    .sort((a, b) => a.offset - b.offset);
};

interface ZoneLineStroke {
  stroke: string;
  stops?: GradientStop[];
}

export const zoneLineStroke = (
  scale: ColorScale | undefined,
  values: Array<number | null | undefined>,
  reversed: boolean,
  gradientId: string,
): ZoneLineStroke | undefined => {
  if (!scale) return undefined;
  const stops = zoneGradientStops(scale, values, reversed);
  if (stops) return { stroke: `url(#${gradientId})`, stops };
  const first = values.find((v): v is number => v !== null && v !== undefined);
  if (first === undefined) return undefined;
  return { stroke: scale.colorAt(first) };
};
