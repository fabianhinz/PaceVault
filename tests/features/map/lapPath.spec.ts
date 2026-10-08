import { describe, expect, it } from 'vitest';
import { lapSubPath, nearestRecordIndex } from '@/features/map/lapPath.ts';
import { buildSportColoredPath } from '@/features/map/zoneColoredPath.ts';
import { lapIndexAtRecord, type LapSpan } from '@/lib/lapRanges.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const records: SessionRecord[] = [
  { timestamp: 0, lat: 49, lng: 8.4 },
  { timestamp: 1 },
  { timestamp: 2, lat: 49, lng: 8.401 },
  { timestamp: 3, lat: 49, lng: 8.402 },
  { timestamp: 4, lat: 49, lng: 8.403 },
  { timestamp: 5, lat: 49, lng: 8.404 },
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
});
