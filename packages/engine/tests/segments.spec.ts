import { describe, expect, it } from 'vite-plus/test';
import {
  matchTolerances,
  segmentPasses,
  segmentReference,
  segmentReferenceFacts,
  segmentTrack,
  type SegmentReferencePoint,
  type SegmentTrack,
} from '../src/segments.ts';
import { gpsPathRecordSeries, type PathWaypoint } from '../../testing/src/series.ts';
import { createMockSegmentReferencePoint } from '../../testing/src/segments.ts';

const NORTH_2_KM: PathWaypoint[] = [
  { eastMeters: 0, northMeters: 0 },
  { eastMeters: 0, northMeters: 2000 },
];

const NORTH_20_KM: PathWaypoint[] = [
  { eastMeters: 0, northMeters: 0 },
  { eastMeters: 0, northMeters: 20000 },
];

const trackOf = ({
  sessionId,
  path,
  speedMetersPerSec = 4,
  legSpeedsMetersPerSec,
  reverse,
}: {
  sessionId: string;
  path: PathWaypoint[];
  speedMetersPerSec?: number;
  legSpeedsMetersPerSec?: number[];
  reverse?: boolean;
}): SegmentTrack => {
  const track = segmentTrack({
    sessionId,
    sport: 'running',
    date: 0,
    records: gpsPathRecordSeries({ path, speedMetersPerSec, legSpeedsMetersPerSec, reverse }),
  });
  if (track === undefined) throw new Error(`no track for ${sessionId}`);
  return track;
};

const referenceOf = (path: PathWaypoint[]): SegmentReferencePoint[] =>
  segmentReference(gpsPathRecordSeries({ path, speedMetersPerSec: 4 }));

const passIds = ({
  reference,
  tracks,
}: {
  reference: SegmentReferencePoint[];
  tracks: SegmentTrack[];
}): string[] =>
  segmentPasses({ reference, tracks })
    .map((pass) => pass.sessionId)
    .sort();

describe('segments', () => {
  describe(segmentPasses.name, () => {
    it('finds one pass for a session on the reference path', () => {
      const passes = segmentPasses({
        reference: referenceOf(NORTH_2_KM),
        tracks: [trackOf({ sessionId: 'a', path: NORTH_2_KM })],
      });

      expect(passes).toHaveLength(1);
      expect(passes[0]?.sessionId).toBe('a');
    });

    it('finds no pass for a session in the opposite direction', () => {
      expect(
        passIds({
          reference: referenceOf(NORTH_2_KM),
          tracks: [trackOf({ sessionId: 'a', path: NORTH_2_KM, reverse: true })],
        }),
      ).toEqual([]);
    });

    it('finds no pass for a session leaving the corridor for more than the coverage allows', () => {
      const detour: PathWaypoint[] = [
        { eastMeters: 0, northMeters: 0 },
        { eastMeters: 0, northMeters: 800 },
        { eastMeters: 200, northMeters: 800 },
        { eastMeters: 200, northMeters: 1100 },
        { eastMeters: 0, northMeters: 1100 },
        { eastMeters: 0, northMeters: 2000 },
      ];

      expect(
        passIds({
          reference: referenceOf(NORTH_2_KM),
          tracks: [
            trackOf({ sessionId: 'a', path: NORTH_2_KM }),
            trackOf({ sessionId: 'b', path: detour }),
          ],
        }),
      ).toEqual(['a']);
    });

    it('finds no pass for a session ending beyond the end tolerance', () => {
      const shortened: PathWaypoint[] = [
        { eastMeters: 0, northMeters: 0 },
        { eastMeters: 0, northMeters: 1920 },
      ];

      expect(
        passIds({
          reference: referenceOf(NORTH_2_KM),
          tracks: [trackOf({ sessionId: 'a', path: shortened })],
        }),
      ).toEqual([]);
    });

    it('accepts an end 150 m off on a 20 km reference', () => {
      const shortened: PathWaypoint[] = [
        { eastMeters: 0, northMeters: 0 },
        { eastMeters: 0, northMeters: 19850 },
      ];

      expect(
        passIds({
          reference: referenceOf(NORTH_20_KM),
          tracks: [trackOf({ sessionId: 'a', path: shortened, speedMetersPerSec: 8 })],
        }),
      ).toEqual(['a']);
    });

    it('keeps one pass with the faster time when a session rides the stretch twice', () => {
      const twice: PathWaypoint[] = [
        ...NORTH_2_KM,
        { eastMeters: 300, northMeters: 2000 },
        { eastMeters: 300, northMeters: 0 },
        ...NORTH_2_KM,
      ];
      const passes = segmentPasses({
        reference: referenceOf(NORTH_2_KM),
        tracks: [
          trackOf({
            sessionId: 'a',
            path: twice,
            speedMetersPerSec: 3,
            legSpeedsMetersPerSec: [3, 3, 3, 3, 5],
          }),
        ],
      });

      expect(passes).toHaveLength(1);
      expect(passes[0]?.durationSec).toBeCloseTo(2000 / 5, -1);
    });

    it('times a pass as the elapsed time between the projected ends', () => {
      const longer: PathWaypoint[] = [
        { eastMeters: 0, northMeters: -500 },
        { eastMeters: 0, northMeters: 2000 },
      ];
      const reference = referenceOf(NORTH_2_KM);
      const passes = segmentPasses({
        reference,
        tracks: [trackOf({ sessionId: 'a', path: longer, speedMetersPerSec: 4 })],
      });

      expect(passes[0]?.startTimestampSec).toBeCloseTo(500 / 4, 0);
      expect(passes[0]?.durationSec).toBeCloseTo(
        segmentReferenceFacts(reference).distanceMeters / 4,
        0,
      );
    });
  });

  describe(matchTolerances.name, () => {
    it('keeps corridor and coverage at every length', () => {
      expect(matchTolerances(500).corridorMeters).toBe(30);
      expect(matchTolerances(100_000).corridorMeters).toBe(30);
      expect(matchTolerances(500).minCoverageRatio).toBe(0.95);
      expect(matchTolerances(100_000).minCoverageRatio).toBe(0.95);
    });

    it('scales the end tolerance with the length within 50 to 200 m', () => {
      expect(matchTolerances(2000).endToleranceMeters).toBe(50);
      expect(matchTolerances(12_000).endToleranceMeters).toBe(120);
      expect(matchTolerances(20_000).endToleranceMeters).toBe(200);
      expect(matchTolerances(100_000).endToleranceMeters).toBe(200);
    });
  });

  describe(segmentReference.name, () => {
    it('resamples the records to 10 m points', () => {
      const reference = referenceOf(NORTH_2_KM);
      const steps = reference
        .slice(1)
        .map((point, i) => Math.round(point.distanceMeters - (reference[i]?.distanceMeters ?? 0)));

      expect(reference).toHaveLength(201);
      expect(new Set(steps)).toEqual(new Set([10]));
    });

    it('keeps missing elevation missing', () => {
      const records = gpsPathRecordSeries({
        path: NORTH_2_KM,
        speedMetersPerSec: 4,
        gradeRatio: null,
      });

      expect(segmentReference(records)[0]?.elevationMeters).toBe(undefined);
    });
  });

  describe(segmentReferenceFacts.name, () => {
    it('returns the distance and the net elevation', () => {
      expect(
        segmentReferenceFacts([
          createMockSegmentReferencePoint({ distanceMeters: 100, elevationMeters: 300 }),
          createMockSegmentReferencePoint({ distanceMeters: 600, elevationMeters: 0 }),
        ]),
      ).toEqual({ distanceMeters: 500, netElevationMeters: -300 });
    });

    it('returns null elevation without elevation, never 0', () => {
      expect(
        segmentReferenceFacts([
          createMockSegmentReferencePoint({ elevationMeters: undefined }),
          createMockSegmentReferencePoint({ distanceMeters: 500, elevationMeters: undefined }),
        ]).netElevationMeters,
      ).toBe(null);
    });
  });
});
