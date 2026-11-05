import { describe, expect, it } from 'vite-plus/test';
import {
  segmentPasses,
  segmentReference,
  segmentTrack,
  type SegmentTrack,
} from '../src/segments.ts';
import { gpsPathRecordSeries, type PathWaypoint } from '../../testing/src/series.ts';

const SESSION_COUNT = 200;
const MATCH_BUDGET_MS = 20_000;

const LOOP_40_KM: PathWaypoint[] = [
  { eastMeters: 0, northMeters: 0 },
  { eastMeters: 0, northMeters: 10000 },
  { eastMeters: 10000, northMeters: 10000 },
  { eastMeters: 10000, northMeters: 0 },
  { eastMeters: 0, northMeters: 0 },
];

const OTHER_ROUTE: PathWaypoint[] = [
  { eastMeters: 0, northMeters: 0 },
  { eastMeters: -10000, northMeters: 0 },
  { eastMeters: -10000, northMeters: -10000 },
];

const tracksOf = (): SegmentTrack[] =>
  Array.from({ length: SESSION_COUNT }, (_, i) => {
    let path = LOOP_40_KM;
    if (i % 2 === 1) path = OTHER_ROUTE;
    return segmentTrack({
      sessionId: `session-${i}`,
      sport: 'cycling',
      date: i,
      records: gpsPathRecordSeries({ path, speedMetersPerSec: 8 + (i % 5) }),
    });
  }).filter((track): track is SegmentTrack => track !== undefined);

describe(segmentPasses.name, () => {
  it('matches a 5 km and a 40 km reference against 200 sessions within the budget', () => {
    const tracks = tracksOf();
    const loopRecords = gpsPathRecordSeries({ path: LOOP_40_KM, speedMetersPerSec: 8 });
    const references = [
      segmentReference(
        loopRecords.filter((record) => record.distance !== undefined && record.distance <= 5000),
      ),
      segmentReference(loopRecords),
    ];
    const startMs = performance.now();
    const passCounts = references.map((reference) => segmentPasses({ reference, tracks }).length);
    const elapsedMs = performance.now() - startMs;

    console.log(
      `segments perf: ${tracks.length} tracks, 2 references in ${elapsedMs.toFixed(0)} ms`,
    );

    expect(passCounts).toEqual([SESSION_COUNT / 2, SESSION_COUNT / 2]);
    expect(elapsedMs).toBeLessThan(MATCH_BUDGET_MS);
  });
});
