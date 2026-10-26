import { scaleLinear } from 'd3-scale';
import {
  HEART_RATE_ZONES,
  POWER_ZONES,
  type HeartRateZoneName,
  type PowerZoneName,
  runningZonesFromThresholdPace,
} from '@pacevault/engine/zones.ts';
import type { RunningZoneName } from '@pacevault/engine/types.ts';
import { tokens, type TokenColor } from '@pacevault/ui/lib/tokens.ts';

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
  tail: tokens.windTail,
  cross: tokens.windCross,
  head: tokens.windHead,
} as const;

const windBlend = scaleLinear<string>()
  .domain([22.5, 90, 157.5])
  .range([WIND_COLORS.head, WIND_COLORS.cross, WIND_COLORS.tail])
  .clamp(true);

export const windColorAt = (angle: number): string => windBlend(angle);

export const COLOR_BY_RUNNING_ZONE: Record<RunningZoneName, TokenColor> = {
  recovery: tokens.zoneBlue,
  easy: tokens.zoneEmerald,
  tempo: tokens.zoneAmber,
  threshold: tokens.zoneOrange,
  vo2max: tokens.zoneRed,
};

export const COLOR_BY_HEART_RATE_ZONE: Record<HeartRateZoneName, TokenColor> = {
  recovery: tokens.zoneBlue,
  aerobic: tokens.zoneEmerald,
  tempo: tokens.zoneAmber,
  threshold: tokens.zoneOrange,
  vo2max: tokens.zoneRed,
};

export const COLOR_BY_POWER_ZONE: Record<PowerZoneName, TokenColor> = {
  active_recovery: tokens.zoneSlate,
  endurance: tokens.zoneBlue,
  tempo: tokens.zoneEmerald,
  threshold: tokens.zoneAmber,
  vo2max: tokens.zoneOrange,
  anaerobic: tokens.zoneRed,
  neuromuscular: tokens.zoneCrimson,
};

const OPEN_ZONE_SPAN = 0.5;

interface PctZoneDef<Name extends string> {
  zone: string;
  name: Name;
  minPct: number;
  maxPct: number;
}

const pctBands = <Name extends string>({
  defs,
  colorByName,
  toValue,
}: {
  defs: readonly PctZoneDef<Name>[];
  colorByName: Record<Name, string>;
  toValue: (pct: number) => number;
}): ZoneBand[] =>
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
      color: colorByName[def.name],
    };
  });

const paceBands = (thresholdPaceSecPerKm: number): ZoneBand[] =>
  runningZonesFromThresholdPace(thresholdPaceSecPerKm).map((zone, i) => {
    const min = zone.fastestPaceSecPerKm / 60;
    const max = zone.slowestPaceSecPerKm / 60;
    return {
      zone: `Z${i + 1}`,
      name: zone.name,
      min,
      max,
      mid: (min + max) / 2,
      color: COLOR_BY_RUNNING_ZONE[zone.name],
    };
  });

export const PALETTE_BY_ZONE_METRIC: Record<ZoneMetric, string[]> = {
  hr: HEART_RATE_ZONES.map((def) => COLOR_BY_HEART_RATE_ZONE[def.name]),
  power: POWER_ZONES.map((def) => COLOR_BY_POWER_ZONE[def.name]),
  pace: runningZonesFromThresholdPace(1).map((zone) => COLOR_BY_RUNNING_ZONE[zone.name]),
};

const bandsFor = ({
  metric,
  thresholds,
}: {
  metric: ZoneMetric;
  thresholds: ZoneThresholds;
}): ZoneBand[] | undefined => {
  switch (metric) {
    case 'hr': {
      const maxHr = thresholds.maxHr;
      const restHr = thresholds.restHr;
      if (maxHr === undefined || restHr === undefined || maxHr <= restHr) return undefined;
      return pctBands({
        defs: HEART_RATE_ZONES,
        colorByName: COLOR_BY_HEART_RATE_ZONE,
        toValue: (pct) => restHr + (maxHr - restHr) * pct,
      });
    }
    case 'power': {
      const ftp = thresholds.ftp;
      if (ftp === undefined || ftp <= 0) return undefined;
      return pctBands({
        defs: POWER_ZONES,
        colorByName: COLOR_BY_POWER_ZONE,
        toValue: (pct) => ftp * pct,
      });
    }
    case 'pace': {
      const thresholdPace = thresholds.thresholdPace;
      if (thresholdPace === undefined || thresholdPace <= 0) return undefined;
      return paceBands(thresholdPace);
    }
  }
};

export const zoneScale = ({
  metric,
  thresholds,
}: {
  metric: ZoneMetric;
  thresholds: ZoneThresholds;
}): ZoneScale | undefined => {
  const unsorted = bandsFor({ metric, thresholds });
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

const zoneGradientStops = ({
  scale,
  values,
  reversed,
}: {
  scale: ColorScale;
  values: Array<number | null | undefined>;
  reversed: boolean;
}): GradientStop[] | undefined => {
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

export const zoneLineStroke = ({
  scale,
  values,
  reversed,
  gradientId,
}: {
  scale: ColorScale | undefined;
  values: Array<number | null | undefined>;
  reversed: boolean;
  gradientId: string;
}): ZoneLineStroke | undefined => {
  if (!scale) return undefined;
  const stops = zoneGradientStops({ scale, values, reversed });
  if (stops) return { stroke: `url(#${gradientId})`, stops };
  const first = values.find((v): v is number => v !== null && v !== undefined);
  if (first === undefined) return undefined;
  return { stroke: scale.colorAt(first) };
};
