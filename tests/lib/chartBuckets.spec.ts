import { describe, it, expect } from 'vitest';
import { bucketSeries } from '@/lib/chartBuckets.ts';

interface Sample {
  t: number;
  power?: number;
  hr?: number;
  speed?: number;
}

const series = (length: number, make: (i: number) => Sample): Sample[] =>
  Array.from({ length }, (_, i) => make(i));

const bucket = (rows: Sample[], targetRows = 100, range?: { from: number; to: number }) =>
  bucketSeries(rows, {
    xKey: 'time',
    x: (r) => r.t,
    channels: {
      power: (r) => r.power,
      hr: (r) => r.hr,
      pace: (r) => {
        if (r.speed === undefined || r.speed <= 0) return null;
        return 1000 / r.speed / 60;
      },
    },
    range,
    targetRows,
  });

describe('bucketSeries', () => {
  it('keeps a single-sample spike that every-nth sampling would drop', () => {
    const rows = series(3600, (i) => ({ t: i, power: i === 1801 ? 391 : 200 }));
    const out = bucket(rows);
    expect(Math.max(...out.map((r) => r.power ?? -1))).toBe(391);
  });

  it('puts every channel on the same grid', () => {
    const rows = series(1000, (i) => ({ t: i, power: 200, hr: 140 }));
    const out = bucket(rows);
    expect(out.length).toBe(100);
    const times = out.map((r) => r.time);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(out.every((r) => 'power' in r && 'hr' in r)).toBe(true);
  });

  it('draws a channel recorded every other sample without gaps', () => {
    const rows = series(1000, (i) => ({ t: i, hr: 140, power: i % 2 === 0 ? 200 : undefined }));
    const out = bucket(rows, 2000);
    expect(out.some((r) => r.power === null)).toBe(false);
  });

  it('produces no gaps for smart recording with varying 1–8 s intervals, also when zoomed', () => {
    const intervals = [1, 2, 3, 4, 5, 6, 7, 8];
    let t = 0;
    const rows = series(1200, (i) => {
      t += intervals[(i * 5) % intervals.length] ?? 1;
      return { t, hr: 140 };
    });
    expect(bucket(rows, 1500).some((r) => r.hr === null)).toBe(false);
    expect(bucket(rows, 1500, { from: 1000, to: 2000 }).some((r) => r.hr === null)).toBe(false);
  });

  it('produces no gaps for regular but sparse samples', () => {
    const rows = series(200, (i) => ({ t: i * 20, hr: 140 }));
    const out = bucket(rows, 2000);
    expect(out.some((r) => r.hr === null)).toBe(false);
  });

  it('turns a pause into null rows of the matching width', () => {
    const before = series(600, (i) => ({ t: i, hr: 140 }));
    const after = series(600, (i) => ({ t: 683 + i, hr: 140 }));
    const out = bucket([...before, ...after], 2000);
    const nullTimes = out.filter((r) => r.hr === null).map((r) => r.time);
    expect(nullTimes.length).toBeGreaterThan(0);
    expect(Math.min(...nullTimes)).toBeGreaterThanOrEqual(599);
    expect(Math.max(...nullTimes)).toBeLessThan(683);
  });

  it('keeps a recorded 0 and leaves pace missing at speed 0', () => {
    const rows = series(100, (i) => ({ t: i, power: 0, speed: 0 }));
    const out = bucket(rows);
    expect(out.every((r) => r.power === 0)).toBe(true);
    expect(out.every((r) => r.pace === null)).toBe(true);
  });

  it('writes min and max in the order they occurred', () => {
    const rows: Sample[] = [
      { t: 0, power: 300 },
      { t: 1, power: 100 },
    ];
    const out = bucketSeries(rows, {
      xKey: 'time',
      x: (r) => r.t,
      channels: { power: (r) => r.power },
      targetRows: 2,
    });
    expect(out.map((r) => r.power)).toEqual([300, 100]);
  });

  it('re-buckets only the zoom range at a higher resolution', () => {
    const rows = series(3600, (i) => ({ t: i, power: i === 1801 ? 391 : 200 }));
    const full = bucket(rows);
    const zoomed = bucket(rows, 100, { from: 1700, to: 1900 });
    expect(zoomed[0]?.time).toBeGreaterThanOrEqual(1700);
    expect((zoomed[1]?.time ?? 0) - (zoomed[0]?.time ?? 0)).toBeLessThan(
      (full[1]?.time ?? 0) - (full[0]?.time ?? 0),
    );
    expect(Math.max(...zoomed.map((r) => r.power ?? -1))).toBe(391);
  });

  it('passes the original index so derived channels can use the previous recorded row', () => {
    const rows = series(10, (i) => ({ t: i, power: i * 10 }));
    const out = bucketSeries(rows, {
      xKey: 'time',
      x: (r) => r.t,
      channels: {
        delta: (r, i) => {
          const prev = rows[i - 1];
          if (!prev || prev.power === undefined || r.power === undefined) return null;
          return r.power - prev.power;
        },
      },
      range: { from: 4, to: 9 },
      targetRows: 100,
    });
    expect(out.every((r) => r.delta === null || r.delta === 10)).toBe(true);
    expect(out.some((r) => r.delta === 10)).toBe(true);
  });

  it('returns no rows for empty input', () => {
    expect(bucket([])).toEqual([]);
  });
});
