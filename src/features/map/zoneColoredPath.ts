import { extractPathFromRecords, isValidCoordinate } from '@/packages/engine/gps.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { HR_ZONE_DEFS, POWER_ZONE_DEFS } from '@/packages/engine/zoneDistribution.ts';
import { computeRunningZones } from '@/packages/engine/zones.ts';
import { scaleLinear } from 'd3-scale';
import { rgb } from 'd3-color';
import { trackModifiers } from './trackColors.ts';

export type ZoneColorMode = 'hr' | 'power' | 'pace';

type Color = [number, number, number, number];
type ColorScale = (value: number) => Color;

export interface DetailPath {
  path: [number, number][];
  color: Color | Color[];
}

export interface UserThresholds {
  maxHr: number;
  restHr: number;
  ftp?: number;
  thresholdPace?: number;
}

const FALLBACK_COLOR: Color = [160, 160, 160, 80];

const createZoneScale = (
  defs: readonly { minPct: number; maxPct: number; color: string }[],
  alpha: number,
): ColorScale => {
  const domain = defs.map((d) => {
    let max = d.maxPct;
    if (!Number.isFinite(max)) {
      max = d.minPct + 0.5;
    }
    return (d.minPct + max) / 2;
  });
  const range = defs.map((d) => d.color);

  const scale = scaleLinear<string>().domain(domain).range(range).clamp(true);

  return (value: number): Color => {
    const c = rgb(scale(value));
    return [Math.round(c.r), Math.round(c.g), Math.round(c.b), alpha];
  };
};

const getHrColor = (hr: number, thresholds: UserThresholds, scale: ColorScale): Color | null => {
  const hrReserve = thresholds.maxHr - thresholds.restHr;
  if (hrReserve <= 0) return null;
  const pct = (hr - thresholds.restHr) / hrReserve;
  return scale(pct);
};

const getPowerColor = (power: number, ftp: number, scale: ColorScale): Color => scale(power / ftp);

const getPaceColor = (speed: number, scale: ColorScale): Color => scale(1000 / speed);

export const buildZoneColoredPath = (
  records: SessionRecord[],
  mode: ZoneColorMode,
  thresholds: UserThresholds,
): DetailPath | null => {
  const alpha = trackModifiers.alpha.highlighted;

  let scale: ColorScale | null = null;
  if (mode === 'hr') {
    scale = createZoneScale(HR_ZONE_DEFS, alpha);
  } else if (mode === 'power') {
    scale = createZoneScale(POWER_ZONE_DEFS, alpha);
  } else if (mode === 'pace' && thresholds.thresholdPace && thresholds.thresholdPace > 0) {
    const zones = computeRunningZones(thresholds.thresholdPace);
    const sorted = [...zones].sort((a, b) => {
      const midA = (a.minPace + a.maxPace) / 2;
      const midB = (b.minPace + b.maxPace) / 2;
      return midA - midB;
    });
    scale = createZoneScale(
      sorted.map((z) => ({ minPct: z.maxPace, maxPct: z.minPace, color: z.color })),
      alpha,
    );
  }

  const colorForRecord = (r: SessionRecord): Color => {
    if (!scale) return FALLBACK_COLOR;
    if (mode === 'hr' && r.hr != null) {
      return getHrColor(r.hr, thresholds, scale) ?? FALLBACK_COLOR;
    }
    if (mode === 'power' && r.power != null && thresholds.ftp) {
      return getPowerColor(r.power, thresholds.ftp, scale);
    }
    if (mode === 'pace' && r.speed != null && r.speed > 0) {
      return getPaceColor(r.speed, scale);
    }
    return FALLBACK_COLOR;
  };

  const path: [number, number][] = [];
  const colors: Color[] = [];

  for (const r of records) {
    if (isValidCoordinate(r) && r.lng != null && r.lat != null) {
      path.push([r.lng, r.lat]);
      colors.push(colorForRecord(r));
    }
  }

  if (path.length < 2) return null;

  return { path, color: colors };
};

export const buildSportColoredPath = (
  records: SessionRecord[],
  sportColor: Color,
): DetailPath | null => {
  const path = extractPathFromRecords(records);
  if (path.length < 2) return null;

  return { path, color: sportColor };
};
