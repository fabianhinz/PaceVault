import { describe, expect, it } from 'vite-plus/test';
import {
  passDotScale,
  passesByYear,
  passRank,
  sessionSegmentsInRideOrder,
} from '@/components/segments/segmentPasses.ts';
import {
  createMockMatchedSegment,
  createMockStoredSegmentPass,
} from '@tests/factories/segments.ts';

const passesWith = (durationsSec: number[]) =>
  durationsSec.map((durationSec, i) =>
    createMockStoredSegmentPass({ sessionId: `s${i}`, date: i, durationSec }),
  );

describe('segmentPasses', () => {
  describe(passDotScale.name, () => {
    it('puts the best at the top and the 90th percentile at the bottom', () => {
      const scale = passDotScale(
        passesWith([300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400]),
      );

      expect(scale(300)).toEqual({ ratio: 0, clamped: false });
      expect(scale(345)).toEqual({ ratio: 0.5, clamped: false });
      expect(scale(390)).toEqual({ ratio: 1, clamped: false });
    });

    it('clamps a slower pass to the bottom edge and marks it', () => {
      const scale = passDotScale(
        passesWith([300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400]),
      );

      expect(scale(400)).toEqual({ ratio: 1, clamped: true });
    });

    it('keeps a single pass at the top', () => {
      expect(passDotScale(passesWith([300]))(300)).toEqual({ ratio: 0, clamped: false });
    });

    it('places every pass at the top when there is none', () => {
      expect(passDotScale([])(300)).toEqual({ ratio: 0, clamped: false });
    });
  });

  describe(passesByYear.name, () => {
    it('groups the passes by year, oldest first', () => {
      const late2025 = createMockStoredSegmentPass({
        sessionId: 'b',
        date: new Date(2025, 11, 31).getTime(),
      });
      const early2025 = createMockStoredSegmentPass({
        sessionId: 'a',
        date: new Date(2025, 0, 2).getTime(),
      });
      const in2026 = createMockStoredSegmentPass({
        sessionId: 'c',
        date: new Date(2026, 0, 1).getTime(),
      });

      expect(passesByYear([in2026, late2025, early2025])).toEqual([
        { year: 2025, passes: [early2025, late2025] },
        { year: 2026, passes: [in2026] },
      ]);
    });
  });

  describe(passRank.name, () => {
    it('ranks by time and shares a rank on a tie', () => {
      const segment = createMockMatchedSegment({ passes: passesWith([300, 280, 280, 310]) });

      expect(passRank({ segment, sessionId: 's1' })).toBe(1);
      expect(passRank({ segment, sessionId: 's2' })).toBe(1);
      expect(passRank({ segment, sessionId: 's0' })).toBe(3);
      expect(passRank({ segment, sessionId: 'missing' })).toBe(undefined);
    });
  });

  describe(sessionSegmentsInRideOrder.name, () => {
    it('orders the segments of a session by where its pass starts along it', () => {
      const later = createMockMatchedSegment({
        id: 'later',
        passes: [createMockStoredSegmentPass({ sessionId: 's', startTimestampSec: 900 })],
      });
      const earlier = createMockMatchedSegment({
        id: 'earlier',
        passes: [createMockStoredSegmentPass({ sessionId: 's', startTimestampSec: 100 })],
      });
      const elsewhere = createMockMatchedSegment({
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
