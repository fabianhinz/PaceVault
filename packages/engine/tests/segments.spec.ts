import { describe, expect, it } from 'vite-plus/test';
import {
  detectedSegments,
  segmentDetectionResult,
  segmentTrack,
  type DetectedSegment,
  type SegmentTrack,
} from '../src/segments.ts';
import { gpsPathRecordSeries, type PathWaypoint } from '../../testing/src/series.ts';

const NORTH_2_KM: PathWaypoint[] = [
  { eastMeters: 0, northMeters: 0 },
  { eastMeters: 0, northMeters: 2000 },
];

const trackOf = ({
  sessionId,
  date,
  path,
  speedMetersPerSec = 4,
  legSpeedsMetersPerSec,
  reverse,
  gradeRatio,
}: {
  sessionId: string;
  date: number;
  path: PathWaypoint[];
  speedMetersPerSec?: number;
  legSpeedsMetersPerSec?: number[];
  reverse?: boolean;
  gradeRatio?: number | null;
}): SegmentTrack => {
  const track = segmentTrack({
    sessionId,
    sport: 'running',
    date,
    records: gpsPathRecordSeries({
      path,
      speedMetersPerSec,
      legSpeedsMetersPerSec,
      reverse,
      gradeRatio,
    }),
  });
  if (track === undefined) throw new Error(`no track for ${sessionId}`);
  return track;
};

const passIds = (segment: DetectedSegment | undefined): string[] =>
  (segment?.passes ?? []).map((pass) => pass.sessionId).sort();

const routeLedBy = ({
  segments,
  sessionId,
}: {
  segments: DetectedSegment[];
  sessionId: string;
}): DetectedSegment | undefined =>
  segments.find((segment) => segment.type === 'route' && segment.leadSessionId === sessionId);

const EAST_AFTER_2_KM: PathWaypoint[] = [...NORTH_2_KM, { eastMeters: 1000, northMeters: 2000 }];

const turnOffPaths = (): { through: PathWaypoint[]; turnOff: PathWaypoint[] } => ({
  through: EAST_AFTER_2_KM,
  turnOff: [
    ...NORTH_2_KM,
    { eastMeters: 500, northMeters: 2000 },
    { eastMeters: 500, northMeters: 2500 },
  ],
});

describe('segments', () => {
  it('finds one route with two passes when two sessions run the same route', () => {
    const segments = detectedSegments({
      sport: 'running',
      tracks: [
        trackOf({ sessionId: 'a', date: 2, path: NORTH_2_KM }),
        trackOf({ sessionId: 'b', date: 1, path: NORTH_2_KM }),
      ],
    });

    expect(segments).toHaveLength(1);
    expect(segments[0]?.type).toBe('route');
    expect(passIds(segments[0])).toEqual(['a', 'b']);
  });

  it('counts no pass for a session in the opposite direction', () => {
    const segments = detectedSegments({
      sport: 'running',
      tracks: [
        trackOf({ sessionId: 'a', date: 3, path: NORTH_2_KM }),
        trackOf({ sessionId: 'b', date: 2, path: NORTH_2_KM, reverse: true }),
        trackOf({ sessionId: 'c', date: 1, path: NORTH_2_KM }),
      ],
    });

    expect(passIds(routeLedBy({ segments, sessionId: 'a' }))).toEqual(['a', 'c']);
  });

  it('counts no pass for a session with a detour below 95 % coverage', () => {
    const detour: PathWaypoint[] = [
      { eastMeters: 0, northMeters: 0 },
      { eastMeters: 0, northMeters: 800 },
      { eastMeters: 200, northMeters: 800 },
      { eastMeters: 200, northMeters: 1100 },
      { eastMeters: 0, northMeters: 1100 },
      { eastMeters: 0, northMeters: 2000 },
    ];
    const segments = detectedSegments({
      sport: 'running',
      tracks: [
        trackOf({ sessionId: 'a', date: 3, path: NORTH_2_KM }),
        trackOf({ sessionId: 'b', date: 2, path: NORTH_2_KM }),
        trackOf({ sessionId: 'c', date: 1, path: detour }),
      ],
    });

    expect(passIds(routeLedBy({ segments, sessionId: 'a' }))).toEqual(['a', 'b']);
  });

  it('counts no pass for a session that ends more than 50 m before the end', () => {
    const shortened: PathWaypoint[] = [
      { eastMeters: 0, northMeters: 0 },
      { eastMeters: 0, northMeters: 1900 },
    ];
    const segments = detectedSegments({
      sport: 'running',
      tracks: [
        trackOf({ sessionId: 'a', date: 3, path: NORTH_2_KM }),
        trackOf({ sessionId: 'b', date: 2, path: NORTH_2_KM }),
        trackOf({ sessionId: 'c', date: 1, path: shortened }),
      ],
    });

    expect(passIds(routeLedBy({ segments, sessionId: 'a' }))).toEqual(['a', 'b']);
  });

  it('keeps one pass with the faster time when a session runs the stretch twice', () => {
    const twice: PathWaypoint[] = [
      ...NORTH_2_KM,
      { eastMeters: 300, northMeters: 2000 },
      { eastMeters: 300, northMeters: 0 },
      ...NORTH_2_KM,
    ];
    const segments = detectedSegments({
      sport: 'running',
      tracks: [
        trackOf({ sessionId: 'a', date: 2, path: NORTH_2_KM }),
        trackOf({
          sessionId: 'b',
          date: 1,
          path: twice,
          speedMetersPerSec: 3,
          legSpeedsMetersPerSec: [3, 3, 3, 3, 5],
        }),
      ],
    });
    const route = routeLedBy({ segments, sessionId: 'a' });
    const passesOfB = (route?.passes ?? []).filter((pass) => pass.sessionId === 'b');

    expect(passesOfB).toHaveLength(1);
    expect(passesOfB[0]?.durationSec).toBeCloseTo(2000 / 5, -1);
  });

  it('finds a segment for the stretch three sessions share before one turns off', () => {
    const paths = turnOffPaths();
    const segments = detectedSegments({
      sport: 'running',
      tracks: [
        trackOf({ sessionId: 'a', date: 3, path: paths.through }),
        trackOf({ sessionId: 'b', date: 2, path: paths.through }),
        trackOf({ sessionId: 'c', date: 1, path: paths.turnOff }),
      ],
    });
    const shared = segments.filter((segment) => passIds(segment).join() === 'a,b,c');

    expect(shared).toHaveLength(1);
    expect(shared[0]?.type).toBe('flat');
  });

  it('finds nothing for a stretch run once', () => {
    expect(
      detectedSegments({
        sport: 'running',
        tracks: [trackOf({ sessionId: 'a', date: 1, path: NORTH_2_KM })],
      }),
    ).toEqual([]);
  });

  it('times a pass as the elapsed time between the projected ends', () => {
    const longer: PathWaypoint[] = [
      { eastMeters: 0, northMeters: -500 },
      { eastMeters: 0, northMeters: 2000 },
    ];
    const segments = detectedSegments({
      sport: 'running',
      tracks: [
        trackOf({ sessionId: 'a', date: 2, path: NORTH_2_KM, speedMetersPerSec: 5 }),
        trackOf({ sessionId: 'b', date: 1, path: longer, speedMetersPerSec: 4 }),
      ],
    });
    const route = routeLedBy({ segments, sessionId: 'a' });
    const passOfB = route?.passes.find((pass) => pass.sessionId === 'b');
    const routeMeters = (route?.endMeters ?? 0) - (route?.startMeters ?? 0);

    expect(passOfB?.startTimestampSec).toBeCloseTo(500 / 4, 0);
    expect(passOfB?.durationSec).toBeCloseTo(routeMeters / 4, 0);
    expect(passOfB?.splitDurationsSec).toHaveLength(25);
  });

  it('keeps a stretch without elevation flat with no elevation change', () => {
    const paths = turnOffPaths();
    const segments = detectedSegments({
      sport: 'running',
      tracks: [
        trackOf({ sessionId: 'a', date: 3, path: paths.through, gradeRatio: null }),
        trackOf({ sessionId: 'b', date: 2, path: paths.through, gradeRatio: null }),
        trackOf({ sessionId: 'c', date: 1, path: paths.turnOff, gradeRatio: null }),
      ],
    });
    const shared = segments.find((segment) => passIds(segment).join() === 'a,b,c');

    expect(shared?.type).toBe('flat');
    expect(shared?.netElevationMeters).toBe(null);
  });

  it('reports the run through the stats with phase times from the injected clock', () => {
    let tickMs = 0;
    const result = segmentDetectionResult({
      sport: 'running',
      tracks: [
        trackOf({ sessionId: 'a', date: 2, path: NORTH_2_KM }),
        trackOf({ sessionId: 'b', date: 1, path: NORTH_2_KM }),
      ],
      clockMs: () => {
        tickMs += 1;
        return tickMs;
      },
    });

    expect(result.segments).toHaveLength(1);
    expect(result.stats.leadsProcessed).toBe(1);
    expect(result.stats.leadsSkippedAsRoute).toBe(1);
    expect(result.stats.candidates).toBe(1);
    expect(result.stats.msByPhase.grid).toBe(1);
    expect(result.stats.msByPhase.corridorMatch).toBeGreaterThan(0);
  });
});
