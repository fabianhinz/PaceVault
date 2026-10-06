import { describe, expect, it } from 'vitest';
import {
  bandsOnRows,
  deviceLapSpans,
  lapBands,
  lapIndexAtRecord,
  lapIndexAtTime,
} from '@/lib/lapRanges.ts';
import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';

const START_MS = 1_700_000_000_000;

const lap = (lapIndex: number, fromSec: number, toSec: number): SessionLap => ({
  lapIndex,
  startTime: START_MS + fromSec * 1000,
  endTime: START_MS + toSec * 1000,
  totalElapsedTime: toSec - fromSec,
  totalTimerTime: toSec - fromSec,
});

const records: SessionRecord[] = [
  ...Array.from({ length: 61 }, (_, i) => ({ timestamp: i, distance: i * 3 })),
  ...Array.from({ length: 60 }, (_, i) => ({ timestamp: 181 + i, distance: 180 + i * 3 })),
];

const laps = [lap(0, 0, 30), lap(1, 30, 200), lap(2, 200, 240)];

describe('lap ranges', () => {
  it('maps device laps to record spans that share their boundaries', () => {
    expect(deviceLapSpans(records, laps)).toEqual([
      { lapIndex: 0, startRecord: 0, endRecord: 30 },
      { lapIndex: 1, startRecord: 30, endRecord: 80 },
      { lapIndex: 2, startRecord: 80, endRecord: 120 },
    ]);
  });

  it('places lap bands on the moving-time axis, without the stop', () => {
    const bands = lapBands(records, deviceLapSpans(records, laps));
    expect(bands.map((band) => [band.from * 60, band.to * 60])).toEqual([
      [0, 30],
      [30, 80],
      [80, 120],
    ]);
  });

  it('finds the lap at a chart time and at a record index', () => {
    const spans = deviceLapSpans(records, laps);
    const bands = lapBands(records, spans);
    expect(lapIndexAtTime(bands, 0)).toBe(0);
    expect(lapIndexAtTime(bands, 0.5)).toBe(1);
    expect(lapIndexAtTime(bands, 2)).toBe(2);
    expect(lapIndexAtTime(bands, 2.5)).toBeUndefined();
    expect(lapIndexAtRecord(spans, 29)).toBe(0);
    expect(lapIndexAtRecord(spans, 30)).toBe(1);
    expect(lapIndexAtRecord(spans, 120)).toBe(2);
    expect(lapIndexAtRecord(spans, 121)).toBeUndefined();
  });

  it('snaps lap bands to the visible chart rows and drops laps outside a zoom', () => {
    const bands = [
      { lapIndex: 0, from: 0, to: 0.5 },
      { lapIndex: 1, from: 0.5, to: 1.4 },
      { lapIndex: 2, from: 1.4, to: 2 },
    ];
    expect(bandsOnRows(bands, [0.6, 0.9, 1.2, 1.5])).toEqual([
      { lapIndex: 1, from: 0.6, to: 1.5 },
      { lapIndex: 2, from: 1.5, to: 1.5 },
    ]);
    expect(bandsOnRows(bands, [])).toEqual([]);
  });
});
