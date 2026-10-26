import type { SessionRecord } from '@pacevault/engine/types.ts';
import type { RouteProfile } from '@pacevault/gpx/routeProfile.ts';
import { gradeAdjustedPaceFactor } from '@pacevault/engine/normalizedEffort.ts';
import { stepsPerMinute } from '@pacevault/engine/cadence.ts';
import { movingSeconds } from '@/lib/movingTime.ts';
import type { SessionTerrain } from '@/lib/sessionTerrain.ts';

export const TARGET_ROWS = 1500;

type Accessor<Row> = (row: Row, index: number) => number | null | undefined;

interface BucketSeriesOptions<Row, K extends string, C extends string> {
  xKey: K;
  x: (row: Row, index: number) => number;
  channels: Record<C, Accessor<Row>>;
  range?: { from: number; to: number };
  targetRows: number;
  emptyBuckets?: 'gap' | 'skip';
}

type BucketRow<Row, K extends string, C extends string> = Record<K, number> &
  Record<C, number | null> & { source: Row | undefined };

interface ChannelBucket {
  min: number;
  minOrder: number;
  max: number;
  maxOrder: number;
}

const SPACING_PERCENTILE = 0.99;

const typicalSpacing = (xs: number[]): number => {
  const deltas: number[] = [];
  for (let i = 1; i < xs.length; i++) {
    const current = xs[i];
    const previous = xs[i - 1];
    if (current === undefined || previous === undefined) continue;
    const delta = current - previous;
    if (delta > 0) deltas.push(delta);
  }
  if (deltas.length === 0) return 0;
  deltas.sort((a, b) => a - b);
  return deltas[Math.min(deltas.length - 1, Math.floor(deltas.length * SPACING_PERCENTILE))] ?? 0;
};

const pairFor = (bucket: ChannelBucket | undefined): [number | null, number | null] => {
  if (!bucket) return [null, null];
  if (bucket.minOrder <= bucket.maxOrder) return [bucket.min, bucket.max];
  return [bucket.max, bucket.min];
};

const channelValues = <Row, K extends string, C extends string>({
  rows,
  options,
  allXs,
  channelKeys,
}: {
  rows: Row[];
  options: BucketSeriesOptions<Row, K, C>;
  allXs: number[];
  channelKeys: C[];
}): { values: Map<C, Array<number | undefined>>; channelSpacing: number } => {
  const values = new Map<C, Array<number | undefined>>();
  let channelSpacing = 0;
  for (const key of channelKeys) {
    const channelValues: Array<number | undefined> = [];
    const channelXs: number[] = [];
    rows.forEach((row, index) => {
      const value = options.channels[key](row, index);
      if (value === undefined || value === null) {
        channelValues.push(undefined);
        return;
      }
      channelValues.push(value);
      const x = allXs[index];
      if (x !== undefined) channelXs.push(x);
    });
    values.set(key, channelValues);
    channelSpacing = Math.max(channelSpacing, typicalSpacing(channelXs));
  }
  return { values, channelSpacing };
};

const rowsInRange = <Row, K extends string, C extends string>({
  rows,
  allXs,
  options,
}: {
  rows: Row[];
  allXs: number[];
  options: BucketSeriesOptions<Row, K, C>;
}): { indices: number[]; xs: number[] } => {
  const indices: number[] = [];
  const xs: number[] = [];
  rows.forEach((row, index) => {
    const x = allXs[index] ?? options.x(row, index);
    if (options.range && (x < options.range.from || x > options.range.to)) return;
    indices.push(index);
    xs.push(x);
  });
  return { indices, xs };
};

interface BucketLayout {
  first: number;
  width: number;
  count: number;
}

const bucketLayout = ({
  xs,
  targetRows,
  channelSpacing,
}: {
  xs: number[];
  targetRows: number;
  channelSpacing: number;
}): BucketLayout => {
  let first = Infinity;
  let last = -Infinity;
  for (const x of xs) {
    if (x < first) first = x;
    if (x > last) last = x;
  }

  const span = last - first;
  const bucketCount = Math.max(1, Math.floor(targetRows / 2));
  let width = Math.max(span / bucketCount, channelSpacing);
  if (width <= 0) {
    width = 1;
  }
  const count = Math.max(1, Math.ceil(span / width));
  return { first, width, count };
};

interface FilledBuckets<Row, C extends string> {
  buckets: Array<Map<C, ChannelBucket>>;
  sources: Array<Row | undefined>;
}

const fillBuckets = <Row, C extends string>({
  rows,
  inRange,
  layout,
  channelKeys,
  values,
}: {
  rows: Row[];
  inRange: { indices: number[]; xs: number[] };
  layout: BucketLayout;
  channelKeys: C[];
  values: Map<C, Array<number | undefined>>;
}): FilledBuckets<Row, C> => {
  const buckets: Array<Map<C, ChannelBucket>> = Array.from(
    { length: layout.count },
    () => new Map(),
  );
  const sources: Array<Row | undefined> = Array.from({ length: layout.count }, () => undefined);

  inRange.xs.forEach((x, order) => {
    const index = inRange.indices[order];
    if (index === undefined) return;
    const row = rows[index];
    if (row === undefined) return;
    const b = Math.min(Math.floor((x - layout.first) / layout.width), layout.count - 1);
    const bucket = buckets[b];
    if (!bucket) return;
    if (sources[b] === undefined) sources[b] = row;

    for (const key of channelKeys) {
      const value = values.get(key)?.[index];
      if (value === undefined) continue;
      const existing = bucket.get(key);
      if (!existing) {
        bucket.set(key, { min: value, minOrder: order, max: value, maxOrder: order });
        continue;
      }
      if (value < existing.min) {
        existing.min = value;
        existing.minOrder = order;
      }
      if (value > existing.max) {
        existing.max = value;
        existing.maxOrder = order;
      }
    }
  });
  return { buckets, sources };
};

const bucketRows = <Row, K extends string, C extends string>({
  filled,
  layout,
  channelKeys,
  options,
}: {
  filled: FilledBuckets<Row, C>;
  layout: BucketLayout;
  channelKeys: C[];
  options: BucketSeriesOptions<Row, K, C>;
}): BucketRow<Row, K, C>[] => {
  const result: BucketRow<Row, K, C>[] = [];
  for (let b = 0; b < layout.count; b++) {
    if (options.emptyBuckets === 'skip' && filled.sources[b] === undefined) continue;
    const start = layout.first + b * layout.width;
    const firstRow: Record<string, unknown> = { [options.xKey]: start, source: filled.sources[b] };
    const secondRow: Record<string, unknown> = {
      [options.xKey]: start + layout.width / 2,
      source: filled.sources[b],
    };
    for (const key of channelKeys) {
      const pair = pairFor(filled.buckets[b]?.get(key));
      firstRow[key] = pair[0];
      secondRow[key] = pair[1];
    }
    result.push(firstRow as BucketRow<Row, K, C>, secondRow as BucketRow<Row, K, C>);
  }
  return result;
};

export const bucketSeries = <Row, K extends string, C extends string>(
  rows: Row[],
  options: BucketSeriesOptions<Row, K, C>,
): BucketRow<Row, K, C>[] => {
  const allXs = rows.map((row, index) => options.x(row, index));
  const channelKeys = Object.keys(options.channels) as C[];
  const channels = channelValues({ rows, options, allXs, channelKeys });
  const inRange = rowsInRange({ rows, allXs, options });
  if (inRange.xs.length === 0) return [];
  const layout = bucketLayout({
    xs: inRange.xs,
    targetRows: options.targetRows,
    channelSpacing: channels.channelSpacing,
  });
  const filled = fillBuckets({ rows, inRange, layout, channelKeys, values: channels.values });
  return bucketRows({ filled, layout, channelKeys, options });
};

interface TimeSeriesPoint {
  time: number;
}

export interface CadencePoint extends TimeSeriesPoint {
  cadence: number | null;
}

export interface HrPoint extends TimeSeriesPoint {
  hr: number | null;
}

export interface PowerPoint extends TimeSeriesPoint {
  power: number | null;
}

export interface SpeedPoint extends TimeSeriesPoint {
  speed: number | null;
}

export interface PacePoint extends TimeSeriesPoint {
  pace: number | null;
}

export interface GAPPoint extends TimeSeriesPoint {
  gap: number | null;
}

const speedToPace = (speed: number | undefined): number | undefined => {
  if (speed === undefined || speed <= 0) return undefined;
  return 1000 / speed / 60;
};

export const hasSeriesValues = <K extends string>(
  points: ReadonlyArray<Record<K, number | null>>,
  key: K,
): boolean => points.some((p) => p[key] !== null);

interface SessionChartRowOptions {
  running: boolean;
  terrain: SessionTerrain;
  range?: { from: number; to: number };
}

export const buildSessionChartRows = (
  records: SessionRecord[],
  options: SessionChartRowOptions,
) => {
  const moving = movingSeconds(records);
  return bucketSeries(records, {
    xKey: 'time',
    x: (_, i) => (moving[i] ?? 0) / 60,
    channels: {
      hr: (r) => r.hr,
      power: (r) => r.power,
      speed: (r) => {
        if (r.speed === undefined) return undefined;
        return r.speed * 3.6;
      },
      cadence: (r) => {
        if (r.cadence === undefined || !options.running) return r.cadence;
        return stepsPerMinute(r.cadence);
      },
      elevation: (r) => r.elevation,
      climbElevation: (r, i) => {
        if (!options.terrain.inClimb[i]) return undefined;
        return r.elevation;
      },
      grade: (_, i) => {
        const gradient = options.terrain.gradients[i];
        if (gradient === undefined) return undefined;
        return gradient * 100;
      },
      pace: (r) => {
        if (!options.running) return undefined;
        return speedToPace(r.speed);
      },
      gap: (r, i) => {
        if (!options.running) return undefined;
        const pace = speedToPace(r.speed);
        const gradient = options.terrain.gradients[i];
        if (pace === undefined || gradient === undefined) return undefined;
        return pace / gradeAdjustedPaceFactor(gradient);
      },
    },
    range: options.range,
    targetRows: TARGET_ROWS,
  });
};

export const gpsByX = <K extends string>(
  rows: ReadonlyArray<Record<K, number> & { source: { lat?: number; lng?: number } | undefined }>,
  key: K,
): Map<number, [number, number]> => {
  const map = new Map<number, [number, number]>();
  for (const row of rows) {
    const lat = row.source?.lat;
    const lng = row.source?.lng;
    if (lat !== undefined && lng !== undefined) map.set(row[key], [lng, lat]);
  }
  return map;
};

export interface RouteChartProfile {
  elevation: { dist: number; elevation: number; lng: number; lat: number }[];
  grade: { dist: number; grade: number | undefined; lng: number; lat: number }[];
}

const kilometersToTheMeter = (meters: number): number => Math.round(meters) / 1000;
const roundToTenth = (value: number): number => Math.round(value * 10) / 10;

export const routeChartProfile = (profile: RouteProfile): RouteChartProfile => ({
  elevation: profile.elevation.map((point) => ({
    dist: kilometersToTheMeter(point.distanceMeters),
    elevation: roundToTenth(point.elevationMeters),
    lng: point.lng,
    lat: point.lat,
  })),
  grade: profile.grade.map((point) => {
    let grade: number | undefined = undefined;
    if (point.gradePercent !== undefined) grade = roundToTenth(point.gradePercent);
    return {
      dist: kilometersToTheMeter(point.distanceMeters),
      grade,
      lng: point.lng,
      lat: point.lat,
    };
  }),
});

export const buildRouteChartRows = (
  profile: RouteChartProfile,
  range?: { from: number; to: number },
) =>
  bucketSeries(profile.elevation, {
    xKey: 'dist',
    x: (p) => p.dist,
    channels: {
      elevation: (p) => p.elevation,
      grade: (_, i) => profile.grade[i]?.grade,
    },
    range,
    targetRows: TARGET_ROWS,
    emptyBuckets: 'skip',
  });
