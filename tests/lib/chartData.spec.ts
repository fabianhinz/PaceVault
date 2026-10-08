import { describe, it, expect } from 'vitest';
import { buildRouteChartRows, buildSessionChartRows, hasSeriesValues } from '@/lib/chartData.ts';
import { buildRouteProfile } from '@/packages/gpx/routeProfile.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const rowsOf = (records: SessionRecord[], isRunning = true) =>
  buildSessionChartRows(records, { isRunning });

describe('buildSessionChartRows', () => {
  it('converts speed to km/h and pace to min/km', () => {
    const rows = rowsOf([
      { timestamp: 0, speed: 1000 / 300 },
      { timestamp: 1, speed: 1000 / 300 },
    ]);
    expect(rows[0]?.speed).toBe(12);
    expect(rows[0]?.pace).toBe(5);
  });

  it('keeps 0 and leaves pace missing at speed 0', () => {
    const rows = rowsOf([
      { timestamp: 0, speed: 0, power: 0, hr: 0, cadence: 0 },
      { timestamp: 1, speed: 0, power: 0, hr: 0, cadence: 0 },
    ]);
    expect(rows.every((r) => r.speed === 0 && r.power === 0 && r.hr === 0)).toBe(true);
    expect(rows.every((r) => r.pace === null && r.gap === null)).toBe(true);
  });

  it('has no pace for cycling sessions', () => {
    const rows = rowsOf(
      [
        { timestamp: 0, speed: 8 },
        { timestamp: 1, speed: 8 },
      ],
      false,
    );
    expect(hasSeriesValues(rows, 'pace')).toBe(false);
  });

  it('gap is faster than pace uphill and slower downhill', () => {
    const up = rowsOf([
      { timestamp: 0, speed: 3.5, grade: 10 },
      { timestamp: 1, speed: 3.5, grade: 10 },
    ])[0];
    const down = rowsOf([
      { timestamp: 0, speed: 3.5, grade: -10 },
      { timestamp: 1, speed: 3.5, grade: -10 },
    ])[0];
    expect(up?.gap).toBeLessThan(up?.pace ?? 0);
    expect(down?.gap).toBeGreaterThan(down?.pace ?? 0);
  });

  it('measures the GAP gradient against the previous recorded record, not a bucket neighbour', () => {
    const records: SessionRecord[] = Array.from({ length: 3600 }, (_, i) => ({
      timestamp: i,
      speed: 3.5,
      distance: i * 3.5,
      elevation: 100 + i * 0.35,
      ...(i === 0 && { grade: 0 }),
    }));
    const rows = rowsOf(records);
    const gaps = rows.map((r) => r.gap).filter((g): g is number => g !== null);
    const pace = rows[10]?.pace ?? 0;
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.slice(1).every((g) => g < pace)).toBe(true);
  });

  it('has no GAP without any grade data', () => {
    const rows = rowsOf([
      { timestamp: 0, speed: 3.5, elevation: 100, distance: 0 },
      { timestamp: 60, speed: 3.5, elevation: 110, distance: 100 },
    ]);
    expect(hasSeriesValues(rows, 'gap')).toBe(false);
  });
});

describe('hasSeriesValues', () => {
  it('is true when at least one value is not null, including 0', () => {
    expect(hasSeriesValues([{ hr: null }, { hr: 0 }], 'hr')).toBe(true);
  });

  it('is false when every value is null', () => {
    expect(hasSeriesValues([{ hr: null }], 'hr')).toBe(false);
  });
});

describe('route chart rows', () => {
  it('keeps a short steep kicker on a huge route', () => {
    const points = Array.from({ length: 10_001 }, (_, i) => {
      const dist = i * 10;
      let ele = 100;
      if (dist > 50_000 && dist <= 50_200) ele = 100 + (dist - 50_000) * 0.14;
      if (dist > 50_200) ele = 128;
      return { lat: 48, lng: 11, ele, dist, seg: 0 };
    });
    const rows = buildRouteChartRows(buildRouteProfile(points));
    expect(rows.length).toBeLessThanOrEqual(1502);
    expect(Math.max(...rows.map((r) => r.grade ?? -Infinity))).toBeCloseTo(14, 0);
  });
});

describe('route chart rows for sparse GPX', () => {
  it('never draws a gap on a long straight stretch with few points', () => {
    const points = [
      ...Array.from({ length: 500 }, (_, i) => ({
        lat: 48,
        lng: 11,
        ele: 100,
        dist: i * 10,
        seg: 0,
      })),
      ...Array.from({ length: 500 }, (_, i) => ({
        lat: 48,
        lng: 11,
        ele: 100,
        dist: 5600 + i * 10,
        seg: 0,
      })),
    ];
    const rows = buildRouteChartRows(buildRouteProfile(points));
    expect(rows.some((r) => r.elevation === null || r.grade === null)).toBe(false);
  });
});
