import { describe, expect, it } from 'vite-plus/test';
import {
  lapSubPath,
  lapVertexBounds,
  lapVertexBreaks,
  nearestRecordIndex,
} from '@/features/map/lapPath.ts';
import { buildSportColoredPath } from '@/features/map/zoneColoredPath.ts';
import { lapIndexAtRecord, type LapSpan } from '@/lib/lapRanges.ts';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';

const records = [
  createMockSessionRecord({ timestamp: 0, lng: 8.4, elevation: 100 }),
  createMockSessionRecord({ timestamp: 1, lat: undefined, lng: undefined }),
  createMockSessionRecord({ timestamp: 2, lng: 8.401, elevation: 0 }),
  createMockSessionRecord({ timestamp: 3, lng: 8.402, elevation: undefined }),
  createMockSessionRecord({ timestamp: 4, lng: 8.403, elevation: 120 }),
  createMockSessionRecord({ timestamp: 5, lng: 8.404, elevation: 130 }),
];

const spans: LapSpan[] = [
  { lapIndex: 0, startRecord: 0, endRecord: 3 },
  { lapIndex: 1, startRecord: 3, endRecord: 5 },
];

const detail = buildSportColoredPath(records, [255, 0, 0, 255]);

describe('lap on the map', () => {
  it('maps a tap on the track to the lap of the nearest record, skipping records without GPS', () => {
    if (!detail) throw new Error('expected a path');
    const nearSecond = nearestRecordIndex(detail, [8.40095, 49.00002]);
    expect(nearSecond).toBe(2);
    expect(lapIndexAtRecord(spans, nearSecond ?? -1)).toBe(0);
    const nearEnd = nearestRecordIndex(detail, [8.4039, 49]);
    expect(lapIndexAtRecord(spans, nearEnd ?? -1)).toBe(1);
  });

  it('cuts the lap out of the track, sharing the boundary point with the next lap', () => {
    if (!detail) throw new Error('expected a path');
    expect(lapSubPath(detail, { lapIndex: 0, startRecord: 0, endRecord: 3 })?.path).toEqual([
      [8.4, 49],
      [8.401, 49],
      [8.402, 49],
    ]);
    expect(lapSubPath(detail, { lapIndex: 1, startRecord: 3, endRecord: 5 })?.path).toEqual([
      [8.402, 49],
      [8.403, 49],
      [8.404, 49],
    ]);
  });

  it('cuts the lap elevations out with the path, keeping 0 m and missing heights', () => {
    if (!detail) throw new Error('expected a path');
    expect(lapSubPath(detail, { lapIndex: 0, startRecord: 0, endRecord: 3 })?.elevations).toEqual([
      100,
      0,
      null,
    ]);
    expect(lapSubPath(detail, { lapIndex: 1, startRecord: 3, endRecord: 5 })?.elevations).toEqual([
      null,
      120,
      130,
    ]);
  });

  it('bounds the vertices of a lap, the same ones its sub-path covers', () => {
    if (!detail) throw new Error('expected a path');
    expect(
      lapVertexBounds({ detailPath: detail, span: { lapIndex: 0, startRecord: 0, endRecord: 3 } }),
    ).toEqual({ first: 0, last: 2 });
    expect(
      lapVertexBounds({ detailPath: detail, span: { lapIndex: 1, startRecord: 3, endRecord: 5 } }),
    ).toEqual({ first: 2, last: 4 });
    expect(
      lapVertexBounds({ detailPath: detail, span: { lapIndex: 2, startRecord: 9, endRecord: 12 } }),
    ).toBeNull();
  });

  it('breaks the line at the first and last vertex of every lap', () => {
    if (!detail) throw new Error('expected a path');
    expect(lapVertexBreaks({ detailPath: detail, spans })).toEqual([0, 2, 2, 4]);
  });
});
