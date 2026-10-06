import { extractPathFromRecords, isValidCoordinate } from '@/packages/engine/gps.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { rgb } from 'd3-color';
import { windColorAt, type ZoneMetric, type ZoneScale } from '@/lib/zoneColors.ts';
import { rollingMean, TRACK_SMOOTHING_SEC } from '@/lib/trackSmoothing.ts';
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

const rawZoneValue = (r: SessionRecord, metric: ZoneMetric): number | undefined => {
  if (metric === 'hr') return r.hr;
  if (metric === 'power') return r.power;
  return r.speed;
};

const toZoneValue = (value: number | undefined, metric: ZoneMetric): number | undefined => {
  if (value === undefined || metric !== 'pace') return value;
  if (value <= 0) return undefined;
  return 1000 / value / 60;
};

const smoothedValues = (
  records: SessionRecord[],
  values: Array<number | undefined>,
  windowSec: number,
): Array<number | undefined> =>
  rollingMean(
    records.map((r) => r.timestamp),
    values,
    windowSec,
  );

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
): DetailPath | null => {
  const values = smoothedValues(
    records,
    records.map((r) => rawZoneValue(r, metric)),
    TRACK_SMOOTHING_SEC[metric],
  );
  return buildColoredPath(records, (_, index) => {
    const value = toZoneValue(values[index], metric);
    if (value === undefined) return FALLBACK_COLOR;
    return toColor(scale.colorAt(value));
  });
};

export const buildWindColoredPath = (
  records: SessionRecord[],
  angles: Array<number | undefined>,
): DetailPath | null => {
  const values = smoothedValues(records, angles, TRACK_SMOOTHING_SEC.wind);
  return buildColoredPath(records, (_, index) => {
    const angle = values[index];
    if (angle === undefined) return FALLBACK_COLOR;
    return toColor(windColorAt(angle));
  });
};

export const buildSportColoredPath = (
  records: SessionRecord[],
  sportColor: Color,
): DetailPath | null => {
  const path = extractPathFromRecords(records);
  if (path.length < 2) return null;

  return { path, color: sportColor };
};
