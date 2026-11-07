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

const SQUARE_LOOP: PathWaypoint[] = [
  { eastMeters: 0, northMeters: 0 },
  { eastMeters: 0, northMeters: 500 },
  { eastMeters: 500, northMeters: 500 },
  { eastMeters: 500, northMeters: 0 },
  { eastMeters: 0, northMeters: 0 },
];

const QUARTER_ARC: PathWaypoint[] = Array.from({ length: 19 }, (_, i) => {
  const radians = (i * 5 * Math.PI) / 180;
  return { eastMeters: 600 - 600 * Math.cos(radians), northMeters: 600 * Math.sin(radians) };
});

const SWITCHBACK: PathWaypoint[] = [
  { eastMeters: 0, northMeters: 0 },
  { eastMeters: 0, northMeters: 300 },
  { eastMeters: 20, northMeters: 300 },
  { eastMeters: 20, northMeters: 0 },
  { eastMeters: 40, northMeters: 0 },
  { eastMeters: 40, northMeters: 300 },
];

type PathSeriesOptions = Parameters<typeof gpsPathRecordSeries>[0];

const trackOf = ({
  sessionId,
  speedMetersPerSec = 4,
  ...series
}: { sessionId: string; speedMetersPerSec?: number } & Omit<
  PathSeriesOptions,
  'speedMetersPerSec'
>): SegmentTrack => {
  const track = segmentTrack({
    sessionId,
    sport: 'running',
    date: 0,
    records: gpsPathRecordSeries({ speedMetersPerSec, ...series }),
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

    describe('on real-track shapes', () => {
      it('passes a track 27 m beside the reference, inside the 30 m corridor', () => {
        expect(
          passIds({
            reference: referenceOf(NORTH_2_KM),
            tracks: [trackOf({ sessionId: 'a', path: NORTH_2_KM, lateralOffsetMeters: 27 })],
          }),
        ).toEqual(['a']);
      });

      it('finds no pass for a track 35 m beside the reference, beyond the corridor', () => {
        expect(
          passIds({
            reference: referenceOf(NORTH_2_KM),
            tracks: [trackOf({ sessionId: 'a', path: NORTH_2_KM, lateralOffsetMeters: 35 })],
          }),
        ).toEqual([]);
      });

      it('passes a track with a few metres of GPS jitter', () => {
        expect(
          passIds({
            reference: referenceOf(NORTH_2_KM),
            tracks: [trackOf({ sessionId: 'a', path: NORTH_2_KM, jitter: { meters: 5, seed: 7 } })],
          }),
        ).toEqual(['a']);
      });

      it('finds only the session on the road when a parallel road runs 45 m beside it', () => {
        expect(
          passIds({
            reference: referenceOf(NORTH_2_KM),
            tracks: [
              trackOf({ sessionId: 'road', path: NORTH_2_KM, jitter: { meters: 3, seed: 2 } }),
              trackOf({ sessionId: 'parallel', path: NORTH_2_KM, lateralOffsetMeters: 45 }),
            ],
          }),
        ).toEqual(['road']);
      });

      it('passes a small detour that stays within the 95 % coverage', () => {
        const detour: PathWaypoint[] = [
          { eastMeters: 0, northMeters: 0 },
          { eastMeters: 0, northMeters: 1000 },
          { eastMeters: 80, northMeters: 1000 },
          { eastMeters: 80, northMeters: 1100 },
          { eastMeters: 0, northMeters: 1100 },
          { eastMeters: 0, northMeters: 2000 },
        ];
        const passes = segmentPasses({
          reference: referenceOf(NORTH_2_KM),
          tracks: [trackOf({ sessionId: 'a', path: detour })],
        });

        expect(passes).toHaveLength(1);
        expect(passes[0]?.coverageRatio).toBeLessThan(1);
        expect(passes[0]?.coverageRatio).toBeGreaterThanOrEqual(0.95);
      });

      it('finds no pass for a shortcut that skips part of the reference', () => {
        const reference = referenceOf([
          { eastMeters: 0, northMeters: 0 },
          { eastMeters: 0, northMeters: 500 },
          { eastMeters: 300, northMeters: 500 },
          { eastMeters: 300, northMeters: 1000 },
          { eastMeters: 0, northMeters: 1000 },
          { eastMeters: 0, northMeters: 1500 },
        ]);
        const shortcut: PathWaypoint[] = [
          { eastMeters: 0, northMeters: 0 },
          { eastMeters: 0, northMeters: 1500 },
        ];

        expect(
          passIds({ reference, tracks: [trackOf({ sessionId: 'a', path: shortcut })] }),
        ).toEqual([]);
      });

      it('finds one pass for one ride of a loop that starts where it ends', () => {
        const passes = segmentPasses({
          reference: referenceOf(SQUARE_LOOP),
          tracks: [trackOf({ sessionId: 'a', path: SQUARE_LOOP, jitter: { meters: 3, seed: 4 } })],
        });

        expect(passes).toHaveLength(1);
        expect(passes[0]?.durationSec).toBeCloseTo(2000 / 4, -1);
      });

      it('keeps one pass with the faster lap when a session rides the loop twice', () => {
        const twice: PathWaypoint[] = [...SQUARE_LOOP, ...SQUARE_LOOP.slice(1)];
        const passes = segmentPasses({
          reference: referenceOf(SQUARE_LOOP),
          tracks: [
            trackOf({
              sessionId: 'a',
              path: twice,
              speedMetersPerSec: 3,
              legSpeedsMetersPerSec: [3, 3, 3, 3, 5, 5, 5, 5],
            }),
          ],
        });

        expect(passes).toHaveLength(1);
        expect(passes[0]?.durationSec).toBeCloseTo(2000 / 5, -1);
      });

      it('times only the outbound leg of an out-and-back', () => {
        const outAndBack: PathWaypoint[] = [...NORTH_2_KM, { eastMeters: 0, northMeters: 0 }];
        const passes = segmentPasses({
          reference: referenceOf(NORTH_2_KM),
          tracks: [trackOf({ sessionId: 'a', path: outAndBack })],
        });

        expect(passes).toHaveLength(1);
        expect(passes[0]?.startTimestampSec).toBeCloseTo(0, 0);
        expect(passes[0]?.durationSec).toBeCloseTo(2000 / 4, -1);
      });

      it('finds no pass on an out-and-back reference for a session that only rides out', () => {
        const outAndBack: PathWaypoint[] = [...NORTH_2_KM, { eastMeters: 0, northMeters: 0 }];

        expect(
          passIds({
            reference: referenceOf(outAndBack),
            tracks: [
              trackOf({ sessionId: 'out', path: NORTH_2_KM }),
              trackOf({ sessionId: 'both', path: outAndBack }),
            ],
          }),
        ).toEqual(['both']);
      });

      it('passes a curved route ridden with jitter and a lateral offset', () => {
        expect(
          passIds({
            reference: referenceOf(QUARTER_ARC),
            tracks: [
              trackOf({
                sessionId: 'a',
                path: QUARTER_ARC,
                lateralOffsetMeters: 15,
                jitter: { meters: 4, seed: 11 },
              }),
            ],
          }),
        ).toEqual(['a']);
      });

      it('passes a switchback whose legs lie 20 m apart', () => {
        const passes = segmentPasses({
          reference: referenceOf(SWITCHBACK),
          tracks: [trackOf({ sessionId: 'a', path: SWITCHBACK, jitter: { meters: 3, seed: 5 } })],
        });

        expect(passes).toHaveLength(1);
        expect(passes[0]?.durationSec).toBeCloseTo(940 / 4, -1);
      });

      it('times the first switchback leg, not a faster leg 40 m beside it', () => {
        const passes = segmentPasses({
          reference: referenceOf(SWITCHBACK.slice(0, 2)),
          tracks: [
            trackOf({
              sessionId: 'a',
              path: SWITCHBACK,
              speedMetersPerSec: 3,
              legSpeedsMetersPerSec: [3, 3, 3, 3, 6],
            }),
          ],
        });

        expect(passes).toHaveLength(1);
        expect(passes[0]?.durationSec).toBeCloseTo(300 / 3, -1);
      });

      it('passes and times a sparse recording with one record every 10 s', () => {
        const passes = segmentPasses({
          reference: referenceOf(QUARTER_ARC),
          tracks: [
            trackOf({
              sessionId: 'a',
              path: [
                { eastMeters: 0, northMeters: -200 },
                ...QUARTER_ARC,
                { eastMeters: 800, northMeters: 600 },
              ],
              speedMetersPerSec: 8,
              recordIntervalSec: 10,
            }),
          ],
        });

        expect(passes).toHaveLength(1);
        expect(passes[0]?.durationSec).toBeCloseTo(
          segmentReferenceFacts(referenceOf(QUARTER_ARC)).distanceMeters / 8,
          0,
        );
      });

      it('passes a curve with a 60 s recording gap', () => {
        expect(
          passIds({
            reference: referenceOf(QUARTER_ARC),
            tracks: [
              trackOf({ sessionId: 'a', path: QUARTER_ARC, gaps: [{ fromSec: 60, toSec: 120 }] }),
            ],
          }),
        ).toEqual(['a']);
      });

      it('finds no pass on a whole-session reference for a session that starts late or stops early', () => {
        const reference = segmentReference(
          gpsPathRecordSeries({
            path: NORTH_2_KM,
            speedMetersPerSec: 4,
            jitter: { meters: 3, seed: 3 },
          }),
        );
        const lateStart: PathWaypoint[] = [
          { eastMeters: 0, northMeters: 200 },
          { eastMeters: 0, northMeters: 2000 },
        ];
        const earlyStop: PathWaypoint[] = [
          { eastMeters: 0, northMeters: 0 },
          { eastMeters: 0, northMeters: 1800 },
        ];

        expect(
          passIds({
            reference,
            tracks: [
              trackOf({ sessionId: 'same', path: NORTH_2_KM, jitter: { meters: 3, seed: 4 } }),
              trackOf({ sessionId: 'late', path: lateStart }),
              trackOf({ sessionId: 'early', path: earlyStop }),
            ],
          }),
        ).toEqual(['same']);
      });
    });

    it('finds the same passes with a reference rebuilt from re-parsed records', () => {
      const route: PathWaypoint[] = [...QUARTER_ARC, { eastMeters: 600, northMeters: 1600 }];
      const tracks = [
        trackOf({ sessionId: 'a', path: route, jitter: { meters: 4, seed: 21 } }),
        trackOf({ sessionId: 'b', path: route, speedMetersPerSec: 5, lateralOffsetMeters: 10 }),
        trackOf({ sessionId: 'reverse', path: route, reverse: true }),
      ];
      const original = segmentPasses({ reference: referenceOf(route), tracks });
      const rebuilt = segmentPasses({
        reference: segmentReference(
          gpsPathRecordSeries({
            path: route,
            speedMetersPerSec: 4,
            recordIntervalSec: 2,
            jitter: { meters: 3, seed: 9 },
          }),
        ),
        tracks,
      });

      expect(rebuilt.map((pass) => pass.sessionId)).toEqual(['a', 'b']);
      expect(original.map((pass) => pass.sessionId)).toEqual(['a', 'b']);
      rebuilt.forEach((pass, i) => {
        expect(
          Math.abs(pass.startTimestampSec - (original[i]?.startTimestampSec ?? 0)),
        ).toBeLessThan(3);
        expect(Math.abs(pass.endTimestampSec - (original[i]?.endTimestampSec ?? 0))).toBeLessThan(
          3,
        );
      });
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
