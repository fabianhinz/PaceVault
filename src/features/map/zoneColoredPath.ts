import { isValidCoordinate } from '@/packages/engine/gps.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { rgb } from 'd3-color';
import { windColorAt, type ColorScale, type ZoneMetric } from '@/lib/zoneColors.ts';
import { rollingMean, TRACK_SMOOTHING_SEC } from '@/lib/trackSmoothing.ts';
import { trackModifiers } from './trackColors.ts';

type Color = [number, number, number, number];

type TrackMetric = ZoneMetric | 'speed';

export interface DetailPath {
  path: [number, number][];
  recordIndices: number[];
  color: Color | Color[];
}

const FALLBACK_COLOR: Color = [160, 160, 160, 80];

const toColor = (css: string): Color => {
  const c = rgb(css);
  return [Math.round(c.r), Math.round(c.g), Math.round(c.b), trackModifiers.alpha.highlighted];
};

const rawZoneValue = (r: SessionRecord, metric: TrackMetric): number | undefined => {
  if (metric === 'hr') return r.hr;
  if (metric === 'power') return r.power;
  return r.speed;
};

const toZoneValue = (value: number | undefined, metric: TrackMetric): number | undefined => {
  if (value === undefined) return undefined;
  if (metric === 'speed') return value * 3.6;
  if (metric !== 'pace') return value;
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

const validPath = (records: SessionRecord[]) => {
  const path: [number, number][] = [];
  const recordIndices: number[] = [];
  records.forEach((r, index) => {
    if (isValidCoordinate(r) && r.lng != null && r.lat != null) {
      path.push([r.lng, r.lat]);
      recordIndices.push(index);
    }
  });
  return { path, recordIndices };
};

const buildColoredPath = (
  records: SessionRecord[],
  colorAt: (r: SessionRecord, index: number) => Color,
): DetailPath | null => {
  const valid = validPath(records);
  if (valid.path.length < 2) return null;
  const colors: Color[] = [];
  for (const index of valid.recordIndices) {
    const record = records[index];
    if (record) colors.push(colorAt(record, index));
  }
  return { path: valid.path, recordIndices: valid.recordIndices, color: colors };
};

export const buildZoneColoredPath = (
  records: SessionRecord[],
  metric: TrackMetric,
  scale: ColorScale,
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
  const valid = validPath(records);
  if (valid.path.length < 2) return null;
  return { path: valid.path, recordIndices: valid.recordIndices, color: sportColor };
};
