export const TARGET_ROWS = 1500;

type Accessor<Row> = (row: Row, index: number) => number | null | undefined;

interface BucketSeriesOptions<Row, K extends string, C extends string> {
  xKey: K;
  x: (row: Row) => number;
  channels: Record<C, Accessor<Row>>;
  range?: { from: number; to: number };
  targetRows: number;
}

export type BucketRow<Row, K extends string, C extends string> = Record<K, number> &
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

export const bucketSeries = <Row, K extends string, C extends string>(
  rows: Row[],
  options: BucketSeriesOptions<Row, K, C>,
): BucketRow<Row, K, C>[] => {
  const allXs = rows.map((row) => options.x(row));
  const channelKeys = Object.keys(options.channels) as C[];
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
  const indices: number[] = [];
  const xs: number[] = [];
  rows.forEach((row, index) => {
    const x = allXs[index] ?? options.x(row);
    if (options.range && (x < options.range.from || x > options.range.to)) return;
    indices.push(index);
    xs.push(x);
  });

  if (xs.length === 0) return [];
  let first = Infinity;
  let last = -Infinity;
  for (const x of xs) {
    if (x < first) first = x;
    if (x > last) last = x;
  }

  const span = last - first;
  const bucketCount = Math.max(1, Math.floor(options.targetRows / 2));
  let width = Math.max(span / bucketCount, channelSpacing);
  if (width <= 0) {
    width = 1;
  }
  const count = Math.max(1, Math.ceil(span / width));

  const buckets: Array<Map<C, ChannelBucket>> = Array.from({ length: count }, () => new Map());
  const sources: Array<Row | undefined> = Array.from({ length: count }, () => undefined);

  xs.forEach((x, order) => {
    const index = indices[order];
    if (index === undefined) return;
    const row = rows[index];
    if (row === undefined) return;
    const b = Math.min(Math.floor((x - first) / width), count - 1);
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

  const result: BucketRow<Row, K, C>[] = [];
  for (let b = 0; b < count; b++) {
    const start = first + b * width;
    const firstRow: Record<string, unknown> = { [options.xKey]: start, source: sources[b] };
    const secondRow: Record<string, unknown> = {
      [options.xKey]: start + width / 2,
      source: sources[b],
    };
    for (const key of channelKeys) {
      const pair = pairFor(buckets[b]?.get(key));
      firstRow[key] = pair[0];
      secondRow[key] = pair[1];
    }
    result.push(firstRow as BucketRow<Row, K, C>, secondRow as BucketRow<Row, K, C>);
  }
  return result;
};
