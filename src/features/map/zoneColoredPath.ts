import { extractPathFromRecords, isValidCoordinate } from '@/packages/engine/gps.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import type { WindClass } from '@/packages/engine/windExposure.ts';
import { rgb } from 'd3-color';
import { WIND_COLORS, type ZoneMetric, type ZoneScale } from '@/lib/zoneColors.ts';
import { trackModifiers } from './trackColors.ts';

type Color = [number, number, number, number];

export interface DetailPath {
  path: [number, number][];
  color: Color | Color[];
}

const FALLBACK_COLOR: Color = [160, 160, 160, 80];

const toColor = (css: string): Color => {
  const c = rgb(css);
  return [Math.round(c.r), Math.round(c.g), Math.round(c.b), trackModifiers.alpha.highlighted];
};

const zoneValue = (r: SessionRecord, metric: ZoneMetric): number | undefined => {
  if (metric === 'hr') return r.hr;
  if (metric === 'power') return r.power;
  if (r.speed === undefined || r.speed <= 0) return undefined;
  return 1000 / r.speed / 60;
};

const buildColoredPath = (
  records: SessionRecord[],
  colorAt: (r: SessionRecord, index: number) => Color,
): DetailPath | null => {
  const path: [number, number][] = [];
  const colors: Color[] = [];
  records.forEach((r, index) => {
    if (isValidCoordinate(r) && r.lng != null && r.lat != null) {
      path.push([r.lng, r.lat]);
      colors.push(colorAt(r, index));
    }
  });
  if (path.length < 2) return null;
  return { path, color: colors };
};

export const buildZoneColoredPath = (
  records: SessionRecord[],
  metric: ZoneMetric,
  scale: ZoneScale,
): DetailPath | null =>
  buildColoredPath(records, (r) => {
    const value = zoneValue(r, metric);
    if (value === undefined) return FALLBACK_COLOR;
    return toColor(scale.colorAt(value));
  });

export const buildWindColoredPath = (
  records: SessionRecord[],
  classes: Array<WindClass | undefined>,
): DetailPath | null =>
  buildColoredPath(records, (_, index) => {
    const windClass = classes[index];
    if (windClass === undefined) return FALLBACK_COLOR;
    return toColor(WIND_COLORS[windClass]);
  });

export const buildSportColoredPath = (
  records: SessionRecord[],
  sportColor: Color,
): DetailPath | null => {
  const path = extractPathFromRecords(records);
  if (path.length < 2) return null;

  return { path, color: sportColor };
};
