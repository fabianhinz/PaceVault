import { isValidCoordinate } from '@pacevault/engine/geodesy.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';
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
  elevations: Array<number | null>;
}

const FALLBACK_COLOR: Color = [160, 160, 160, 80];

const toColor = (css: string): Color => {
  const c = rgb(css);
  return [Math.round(c.r), Math.round(c.g), Math.round(c.b), trackModifiers.alpha.highlighted];
};

const ZONE_VALUE_BY_METRIC: Record<TrackMetric, (record: SessionRecord) => number | undefined> = {
  hr: (record) => record.hr,
  power: (record) => record.power,
  pace: (record) => record.speed,
  speed: (record) => record.speed,
};

const toZoneValue = ({
  value,
  metric,
}: {
  value: number | undefined;
  metric: TrackMetric;
}): number | undefined => {
  if (value === undefined) return undefined;
  if (metric === 'speed') return value * 3.6;
  if (metric !== 'pace') return value;
  if (value <= 0) return undefined;
  return 1000 / value / 60;
};

const smoothedValues = ({
  records,
  values,
  windowSec,
}: {
  records: SessionRecord[];
  values: Array<number | undefined>;
  windowSec: number;
}): Array<number | undefined> =>
  rollingMean({ times: records.map((r) => r.timestamp), values, windowSec });

const validPath = (records: SessionRecord[]) => {
  const path: [number, number][] = [];
  const recordIndices: number[] = [];
  const elevations: Array<number | null> = [];
  records.forEach((r, index) => {
    if (isValidCoordinate(r)) {
      path.push([r.lng, r.lat]);
      recordIndices.push(index);
      elevations.push(r.elevation ?? null);
    }
  });
  return { path, recordIndices, elevations };
};

const buildColoredPath = ({
  records,
  colorAt,
}: {
  records: SessionRecord[];
  colorAt: (index: number) => Color;
}): DetailPath | null => {
  const valid = validPath(records);
  if (valid.path.length < 2) return null;
  const colors: Color[] = [];
  for (const index of valid.recordIndices) {
    const record = records[index];
    if (record) colors.push(colorAt(index));
  }
  return {
    path: valid.path,
    recordIndices: valid.recordIndices,
    color: colors,
    elevations: valid.elevations,
  };
};

export const buildZoneColoredPath = ({
  records,
  metric,
  scale,
}: {
  records: SessionRecord[];
  metric: TrackMetric;
  scale: ColorScale;
}): DetailPath | null => {
  const values = smoothedValues({
    records,
    values: records.map(ZONE_VALUE_BY_METRIC[metric]),
    windowSec: TRACK_SMOOTHING_SEC[metric],
  });
  return buildColoredPath({
    records,
    colorAt: (index) => {
      const value = toZoneValue({ value: values[index], metric });
      if (value === undefined) return FALLBACK_COLOR;
      return toColor(scale.colorAt(value));
    },
  });
};

export const buildWindColoredPath = ({
  records,
  angles,
}: {
  records: SessionRecord[];
  angles: Array<number | undefined>;
}): DetailPath | null => {
  const values = smoothedValues({ records, values: angles, windowSec: TRACK_SMOOTHING_SEC.wind });
  return buildColoredPath({
    records,
    colorAt: (index) => {
      const angle = values[index];
      if (angle === undefined) return FALLBACK_COLOR;
      return toColor(windColorAt(angle));
    },
  });
};

export const buildSportColoredPath = ({
  records,
  sportColor,
}: {
  records: SessionRecord[];
  sportColor: Color;
}): DetailPath | null => {
  const valid = validPath(records);
  if (valid.path.length < 2) return null;
  return {
    path: valid.path,
    recordIndices: valid.recordIndices,
    color: sportColor,
    elevations: valid.elevations,
  };
};
