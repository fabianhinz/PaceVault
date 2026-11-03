import { describe, expect, it } from 'vite-plus/test';
import { detectedSegments, segmentTrack, type SegmentTrack } from '../src/segments.ts';
import { gpsPathRecordSeries, type PathWaypoint } from '../../testing/src/series.ts';

const ROUTES: PathWaypoint[][] = [
  [
    { eastMeters: 0, northMeters: 0 },
    { eastMeters: 0, northMeters: 2500 },
    { eastMeters: 2000, northMeters: 2500 },
    { eastMeters: 2000, northMeters: 5000 },
  ],
  [
    { eastMeters: 0, northMeters: 0 },
    { eastMeters: 0, northMeters: 2500 },
    { eastMeters: -2500, northMeters: 2500 },
    { eastMeters: -2500, northMeters: 0 },
  ],
  [
    { eastMeters: 5000, northMeters: 0 },
    { eastMeters: 8000, northMeters: 0 },
    { eastMeters: 8000, northMeters: 3000 },
  ],
];
const PASSES_PER_ROUTE = 6;
const DETECTION_BUDGET_MS = 10_000;

const tracksOf = (): SegmentTrack[] =>
  ROUTES.flatMap((path, routeIndex) =>
    Array.from({ length: PASSES_PER_ROUTE }, (_, passIndex) => {
      const sessionId = `route-${routeIndex}-pass-${passIndex}`;
      const records = gpsPathRecordSeries({ path, speedMetersPerSec: 3 + passIndex * 0.2 });
      return segmentTrack({
        sessionId,
        sport: 'running',
        date: routeIndex * 100 + passIndex,
        records,
      });
    }).filter((track): track is SegmentTrack => track !== undefined),
  );

describe('segments performance', () => {
  it('builds tracks and detects segments for 18 sessions at 1 Hz within the budget', () => {
    const startMs = performance.now();
    const tracks = tracksOf();
    const tracksBuiltMs = performance.now();
    const segments = detectedSegments({ sport: 'running', tracks });
    const detectedMs = performance.now();

    console.log(
      `segments perf: ${tracks.length} tracks in ${(tracksBuiltMs - startMs).toFixed(0)} ms, ` +
        `${segments.length} segments in ${(detectedMs - tracksBuiltMs).toFixed(0)} ms`,
    );

    expect(tracks).toHaveLength(ROUTES.length * PASSES_PER_ROUTE);
    expect(segments).toHaveLength(ROUTES.length);
    expect(detectedMs - startMs).toBeLessThan(DETECTION_BUDGET_MS);
  });
});
