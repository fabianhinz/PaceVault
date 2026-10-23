import { describe, expect, it } from 'vite-plus/test';
import {
  buildTerrainLineFeatures,
  nearestLineVertex,
  terrainHoverLine,
  terrainLineRunIdsWithin,
  terrainLineRuns,
  terrainLineWidthExpression,
  type LineColor,
} from '@/features/map/terrainLine.ts';

const path: [number, number][] = [
  [8.4, 49],
  [8.401, 49],
  [8.402, 49.001],
  [8.403, 49.001],
  [8.404, 49.002],
];

const red: LineColor = [255, 0, 0, 255];
const green: LineColor = [0, 200, 0, 255];

const zoomStops = (expression: unknown): unknown[] => {
  if (!Array.isArray(expression)) return [];
  return [expression[3], expression[5], expression[7]];
};

describe('terrainLineRuns', () => {
  it('merges a single-coloured path into one run', () => {
    expect(terrainLineRuns({ path, colors: red, breaks: [] })).toEqual([{ first: 0, last: 4 }]);
  });

  it('starts a new run where the colour of a segment changes', () => {
    const colors = [red, red, green, green, green];
    expect(terrainLineRuns({ path, colors, breaks: [] })).toEqual([
      { first: 0, last: 2 },
      { first: 2, last: 4 },
    ]);
  });

  it('cuts a run at every break vertex even when the colour stays', () => {
    expect(terrainLineRuns({ path, colors: red, breaks: [1, 3] })).toEqual([
      { first: 0, last: 1 },
      { first: 1, last: 3 },
      { first: 3, last: 4 },
    ]);
  });

  it('leaves out segments without a colour', () => {
    expect(terrainLineRuns({ path, colors: [red, red], breaks: [] })).toEqual([
      { first: 0, last: 2 },
    ]);
  });
});

describe('buildTerrainLineFeatures', () => {
  it('builds one feature per run, keyed by the run index, carrying its vertex range', () => {
    const runs = terrainLineRuns({ path, colors: red, breaks: [2] });
    const lines = buildTerrainLineFeatures({ path, runs, colors: red, dimFactor: 0.8 });
    expect(lines.features.map((feature) => feature.id)).toEqual([0, 1]);
    expect(lines.features[1]?.geometry.coordinates).toEqual([
      [8.402, 49.001],
      [8.403, 49.001],
      [8.404, 49.002],
    ]);
    expect(lines.features[1]?.properties).toEqual({
      c: 'rgba(255,0,0,1.000)',
      d: 'rgba(204,0,0,1.000)',
      v: 2,
      e: 4,
    });
  });

  it('colours each run with the colour of its first vertex', () => {
    const colors: LineColor[] = [
      [10, 20, 30, 255],
      [100, 50, 0, 51],
      [100, 50, 0, 51],
      [100, 50, 0, 51],
    ];
    const runs = terrainLineRuns({ path, colors, breaks: [] });
    const lines = buildTerrainLineFeatures({ path, runs, colors, dimFactor: 0.5 });
    expect(lines.features.map((feature) => feature.properties)).toEqual([
      { c: 'rgba(10,20,30,1.000)', d: 'rgba(5,10,15,1.000)', v: 0, e: 1 },
      { c: 'rgba(100,50,0,0.200)', d: 'rgba(50,25,0,0.200)', v: 1, e: 4 },
    ]);
  });
});

describe('terrainLineRunIdsWithin', () => {
  it('lists the runs that lie inside a vertex range', () => {
    const runs = terrainLineRuns({ path, colors: red, breaks: [1, 3] });
    expect(terrainLineRunIdsWithin({ runs, first: 1, last: 3 })).toEqual([1]);
    expect(terrainLineRunIdsWithin({ runs, first: 0, last: 4 })).toEqual([0, 1, 2]);
    expect(terrainLineRunIdsWithin({ runs, first: 2, last: 4 })).toEqual([2]);
  });
});

describe('terrainHoverLine', () => {
  it('draws a path as one line and nothing without a path', () => {
    expect(terrainHoverLine(path.slice(0, 2))).toEqual({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: path.slice(0, 2) },
    });
    expect(terrainHoverLine(null)).toEqual({ type: 'FeatureCollection', features: [] });
  });
});

describe('nearestLineVertex', () => {
  it('picks the vertex closest to the pointer across hit runs where start and finish of a loop overlap', () => {
    const loop: [number, number][] = [
      [8.4, 49],
      [8.41, 49],
      [8.41, 49.01],
      [8.4, 49.01],
      [8.4001, 49.0001],
    ];
    const ranges = [
      { first: 0, last: 1 },
      { first: 3, last: 4 },
    ];
    expect(nearestLineVertex({ path: loop, ranges, coordinate: [8.40011, 49.00012] })).toBe(4);
    expect(nearestLineVertex({ path: loop, ranges, coordinate: [8.39998, 48.99999] })).toBe(0);
  });

  it('only looks inside the hit runs', () => {
    const ranges = [{ first: 3, last: 4 }];
    expect(nearestLineVertex({ path, ranges, coordinate: [8.4, 49] })).toBe(3);
  });

  it('returns undefined without hits', () => {
    expect(nearestLineVertex({ path, ranges: [], coordinate: [8.4, 49] })).toBeUndefined();
  });
});

describe('terrainLineWidthExpression', () => {
  it('keeps its zoom stops ascending at a low and a high latitude', () => {
    for (const latitude of [5, 78]) {
      const stops = zoomStops(terrainLineWidthExpression({ metres: 12, minPixels: 3, latitude }));
      expect(stops[0]).toBe(0);
      expect(stops[1]).toBeGreaterThan(0);
      expect(stops[1]).toBeLessThan(22);
      expect(stops[2]).toBe(22);
    }
  });

  it('holds the pixel minimum up to the zoom where the metre width takes over', () => {
    const expression = terrainLineWidthExpression({ metres: 12, minPixels: 3, latitude: 47 });
    if (!Array.isArray(expression)) throw new Error('expected an expression');
    expect(expression[4]).toBe(3);
    expect(expression[6]).toBe(3);
    expect(expression[8]).toBeGreaterThan(3);
  });
});
