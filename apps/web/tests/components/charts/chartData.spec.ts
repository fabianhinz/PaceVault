import { describe, it, expect } from 'vite-plus/test';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import {
  buildRouteChartRows,
  buildSessionChartRows,
  hasSeriesValues,
  routeChartProfile,
} from '@/components/charts/chartData.ts';
import { buildRouteProfile } from '@pacevault/gpx/routeProfile.ts';
import { createMockRoutePoint } from '@pacevault/testing/route.ts';
import { buildSessionTerrain } from '@/components/charts/sessionTerrain.ts';
import type { SessionRecord, Sport } from '@pacevault/engine/types.ts';

const rowsOf = (records: SessionRecord[], sport: Sport = 'running') =>
  buildSessionChartRows(records, {
    running: sport === 'running',
    terrain: buildSessionTerrain({ sport, records }),
  });

const steadyRun = (gradient: number): SessionRecord[] =>
  Array.from({ length: 120 }, (_, i) => ({
    timestamp: i,
    speed: 3.5,
    distance: i * 3.5,
    elevation: 100 + i * 3.5 * gradient,
  }));

describe(buildSessionChartRows.name, () => {
  it('converts speed to km/h and pace to min/km', () => {
    const rows = rowsOf([
      createMockSessionRecord({ timestamp: 0, speed: 1000 / 300 }),
      createMockSessionRecord({ timestamp: 1, speed: 1000 / 300 }),
    ]);
    expect(rows[0]?.speed).toBe(12);
    expect(rows[0]?.pace).toBe(5);
  });

  it('keeps 0 and leaves pace missing at speed 0', () => {
    const rows = rowsOf([
      createMockSessionRecord({ timestamp: 0, speed: 0, power: 0, hr: 0, cadence: 0 }),
      createMockSessionRecord({ timestamp: 1, speed: 0, power: 0, hr: 0, cadence: 0 }),
    ]);
    expect(rows.filter((r) => !(r.speed === 0 && r.power === 0 && r.hr === 0))).toEqual([]);
    expect(rows.filter((r) => !(r.pace === null && r.gap === null))).toEqual([]);
  });

  it('has no pace for cycling sessions', () => {
    const rows = rowsOf(
      [
        createMockSessionRecord({ timestamp: 0, speed: 8 }),
        createMockSessionRecord({ timestamp: 1, speed: 8 }),
      ],
      'cycling',
    );
    expect(hasSeriesValues(rows, 'pace')).toBe(false);
  });

  it('gap is faster than pace uphill and slower downhill', () => {
    const up = rowsOf(steadyRun(0.1))[0];
    const down = rowsOf(steadyRun(-0.1))[0];
    expect(up?.gap).toBeLessThan(up?.pace ?? 0);
    expect(down?.gap).toBeGreaterThan(down?.pace ?? 0);
  });

  it('measures the GAP gradient against the previous recorded record, not a bucket neighbour', () => {
    const records: SessionRecord[] = Array.from({ length: 3600 }, (_, i) => ({
      timestamp: i,
      speed: 3.5,
      distance: i * 3.5,
      elevation: 100 + i * 0.35,
    }));
    const rows = rowsOf(records);
    const gaps = rows.map((r) => r.gap).filter((g): g is number => g !== null);
    const pace = rows[10]?.pace ?? 0;
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.slice(1).filter((g) => !(g < pace))).toEqual([]);
  });

  it('trail runs without a grade field get a GAP and a Grade chart', () => {
    const rows = rowsOf(steadyRun(0.12));
    expect(hasSeriesValues(rows, 'gap')).toBe(true);
    expect(rows[60]?.grade).toBeCloseTo(12, 6);
  });
});

describe('running cadence', () => {
  it('running cadence chart shows steps per minute', () => {
    const records: SessionRecord[] = [
      createMockSessionRecord({ timestamp: 0, cadence: 85 }),
      createMockSessionRecord({ timestamp: 1, cadence: 85 }),
    ];
    expect(rowsOf(records, 'running')[0]?.cadence).toBe(170);
    expect(rowsOf(records, 'cycling')[0]?.cadence).toBe(85);
  });
});

describe(hasSeriesValues.name, () => {
  it('is true when at least one value is not null, including 0', () => {
    expect(hasSeriesValues([{ hr: null }, { hr: 0 }], 'hr')).toBe(true);
  });

  it('is false when every value is null', () => {
    expect(hasSeriesValues([{ hr: null }], 'hr')).toBe(false);
  });
});

describe('route chart rows', () => {
  it('rounds distance to kilometres and elevation and grade to a tenth', () => {
    const point = (dist: number, ele: number) =>
      createMockRoutePoint({ lat: 47 + dist / 111_190, ele, dist });
    const profile = routeChartProfile(buildRouteProfile([point(0, 500.04), point(1500, 620.26)]));
    expect(profile.elevation[0]).toMatchObject({ dist: 0, elevation: 500, lng: 11 });
    expect(profile.elevation[1]).toMatchObject({ dist: 1.5, elevation: 620.3 });
  });

  it('keeps a short steep kicker on a huge route', () => {
    const points = Array.from({ length: 10_001 }, (_, i) => {
      const dist = i * 10;
      let ele = 100;
      if (dist > 50_000 && dist <= 50_200) ele = 100 + (dist - 50_000) * 0.14;
      if (dist > 50_200) ele = 128;
      return createMockRoutePoint({ lat: 48, ele, dist });
    });
    const rows = buildRouteChartRows(routeChartProfile(buildRouteProfile(points)));
    expect(rows.length).toBeLessThanOrEqual(1502);
    expect(Math.max(...rows.map((r) => r.grade ?? -Infinity))).toBeCloseTo(14, 0);
  });
});

describe('route chart rows for sparse GPX', () => {
  it('never draws a gap on a long straight stretch with few points', () => {
    const points = [
      ...Array.from({ length: 500 }, (_, i) =>
        createMockRoutePoint({ lat: 48, ele: 100, dist: i * 10 }),
      ),
      ...Array.from({ length: 500 }, (_, i) =>
        createMockRoutePoint({ lat: 48, ele: 100, dist: 5600 + i * 10 }),
      ),
    ];
    const rows = buildRouteChartRows(routeChartProfile(buildRouteProfile(points)));
    expect(rows.filter((r) => r.elevation === null || r.grade === null)).toEqual([]);
  });
});
