import { describe, expect, it } from 'vite-plus/test';
import {
  gapSeriesSec,
  latestWindowSessionIds,
  passPositionAt,
  passRank,
  passesByDate,
  rollingMedianSec,
  sessionSegmentsInRideOrder,
} from '@/components/segments/segmentPasses.ts';
import { createMockSegment, createMockStoredSegmentPass } from '@tests/factories/segments.ts';

const passesWith = (durationsSec: number[]) =>
  durationsSec.map((durationSec, i) =>
    createMockStoredSegmentPass({ sessionId: `s${i}`, date: i, durationSec }),
  );

describe('segmentPasses', () => {
  describe(rollingMedianSec.name, () => {
    it('takes the median of up to the last five passes by date', () => {
      expect(rollingMedianSec(passesWith([10, 30, 20, 40, 50, 60]))).toEqual([
        10, 20, 20, 25, 30, 40,
      ]);
    });
  });

  describe(passRank.name, () => {
    it('ranks by time and shares a rank on a tie', () => {
      const segment = createMockSegment({ passes: passesWith([300, 280, 280, 310]) });

      expect(passRank({ segment, sessionId: 's1' })).toBe(1);
      expect(passRank({ segment, sessionId: 's2' })).toBe(1);
      expect(passRank({ segment, sessionId: 's0' })).toBe(3);
      expect(passRank({ segment, sessionId: 'missing' })).toBe(undefined);
    });
  });

  describe(latestWindowSessionIds.name, () => {
    it('keeps the last ten passes by date and nothing for short lists', () => {
      const many = createMockSegment({ passes: passesWith(Array.from({ length: 12 }, () => 300)) });

      expect(latestWindowSessionIds(many)).toEqual(
        new Set(
          passesByDate(many)
            .slice(2)
            .map((pass) => pass.sessionId),
        ),
      );
      expect(latestWindowSessionIds(createMockSegment({ passes: passesWith([1, 2]) }))).toBe(null);
    });
  });

  describe(gapSeriesSec.name, () => {
    it('is the best split time minus the pass split time', () => {
      const best = createMockStoredSegmentPass({ splitDurationsSec: [0, 10, 20] });
      const pass = createMockStoredSegmentPass({ splitDurationsSec: [0, 12, 25] });

      expect(gapSeriesSec({ pass, best })).toEqual([0, -2, -5]);
    });
  });

  describe(passPositionAt.name, () => {
    it('places a pass along the geometry by its split times', () => {
      const segment = createMockSegment({
        geometry: [
          [48, 11],
          [48.002, 11],
        ],
      });
      const pass = createMockStoredSegmentPass({ durationSec: 20, splitDurationsSec: [0, 10, 20] });
      const position = passPositionAt({ segment, pass, elapsedSec: 10 });

      expect(position?.[0]).toBeCloseTo(48.001, 6);
      expect(passPositionAt({ segment, pass, elapsedSec: 30 })).toEqual([48.002, 11]);
    });
  });

  describe(sessionSegmentsInRideOrder.name, () => {
    it('orders the segments of a session by where its pass starts along it', () => {
      const later = createMockSegment({
        id: 'later',
        typeNumber: 1,
        passes: [createMockStoredSegmentPass({ sessionId: 's', startTimestampSec: 900 })],
      });
      const earlier = createMockSegment({
        id: 'earlier',
        typeNumber: 2,
        passes: [createMockStoredSegmentPass({ sessionId: 's', startTimestampSec: 100 })],
      });
      const elsewhere = createMockSegment({
        id: 'elsewhere',
        passes: [createMockStoredSegmentPass({ sessionId: 'other' })],
      });

      expect(
        sessionSegmentsInRideOrder({ segments: [later, elsewhere, earlier], sessionId: 's' }).map(
          (entry) => entry.segment.id,
        ),
      ).toEqual(['earlier', 'later']);
    });
  });
});
