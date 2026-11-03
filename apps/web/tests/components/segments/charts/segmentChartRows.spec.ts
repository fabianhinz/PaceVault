import { describe, expect, it } from 'vite-plus/test';
import { passSeries, segmentChartRows } from '@/components/segments/charts/segmentChartRows.ts';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import { createMockStoredSegmentPass } from '@tests/factories/segments.ts';

const records = [
  createMockSessionRecord({ timestamp: 98, hr: 120, power: 150 }),
  createMockSessionRecord({ timestamp: 100, hr: 130, power: 0 }),
  createMockSessionRecord({ timestamp: 101, power: 200 }),
  createMockSessionRecord({ timestamp: 102, hr: 150, power: 210 }),
  createMockSessionRecord({ timestamp: 105, hr: 160, power: 220 }),
];
const pass = createMockStoredSegmentPass({ startTimestampSec: 100, endTimestampSec: 102.5 });

describe('segmentChartRows', () => {
  it('slices the records to the pass span on elapsed seconds from the segment start', () => {
    expect(passSeries({ records, pass, running: false }).elapsedSec).toEqual([0, 1, 2]);
  });

  it('keeps one point per record, a missing value as null and a recorded 0', () => {
    const series = passSeries({ records, pass, running: false });

    expect(series.values.hr).toEqual([130, null, 150]);
    expect(series.values.power).toEqual([0, 200, 210]);
  });

  it('plots the best pass beside the selected one on a shared time axis', () => {
    const selected = passSeries({ records, pass, running: false });
    const best = passSeries({
      records,
      pass: createMockStoredSegmentPass({ startTimestampSec: 100, endTimestampSec: 101 }),
      running: false,
    });

    expect(segmentChartRows({ selected, best, channel: 'power' })).toEqual([
      { elapsedSec: 0, selected: 0, best: 0 },
      { elapsedSec: 0, selected: 0, best: 0 },
      { elapsedSec: 1, selected: 200, best: 200 },
      { elapsedSec: 1, selected: 200, best: 200 },
      { elapsedSec: 2, selected: 210, best: null },
    ]);
  });
});
