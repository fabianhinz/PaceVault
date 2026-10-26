import { describe, it, expect } from 'vite-plus/test';
import {
  densestClusterBounds,
  hasBoundsOverlap,
  isSegmentIntersectingBounds,
} from '../src/bounds.ts';
import type { GPSBounds } from '../src/types.ts';

describe('bounds', () => {
  describe(hasBoundsOverlap.name, () => {
    it('returns true for overlapping boxes', () => {
      const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
      const b = { minLat: 48.3, maxLat: 48.8, minLng: 11.3, maxLng: 11.8 };
      expect(hasBoundsOverlap({ first: a, second: b })).toBe(true);
    });

    it('returns false for disjoint boxes', () => {
      const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
      const b = { minLat: 50.0, maxLat: 50.5, minLng: 13.0, maxLng: 13.5 };
      expect(hasBoundsOverlap({ first: a, second: b })).toBe(false);
    });

    it('returns true for touching edges', () => {
      const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
      const b = { minLat: 48.5, maxLat: 49.0, minLng: 11.5, maxLng: 12.0 };
      expect(hasBoundsOverlap({ first: a, second: b })).toBe(true);
    });
  });

  describe(densestClusterBounds.name, () => {
    it('returns null for empty array', () => {
      expect(densestClusterBounds([])).toBeNull();
    });

    it('returns single bounds unchanged', () => {
      const b = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
      expect(densestClusterBounds([b])).toEqual(b);
    });

    it('picks the dense cluster over an outlier', () => {
      const munich1 = { minLat: 48.0, maxLat: 48.2, minLng: 11.4, maxLng: 11.6 };
      const munich2 = { minLat: 48.1, maxLat: 48.3, minLng: 11.5, maxLng: 11.7 };
      const munich3 = { minLat: 48.05, maxLat: 48.25, minLng: 11.45, maxLng: 11.65 };
      const berlin = { minLat: 52.4, maxLat: 52.6, minLng: 13.3, maxLng: 13.5 };

      const result = densestClusterBounds([munich1, munich2, munich3, berlin]);
      expect(result).not.toBeNull();
      expect(result?.maxLat).toBeLessThan(49);
      expect(result?.minLng).toBeGreaterThan(11);
    });

    it('returns union of all when everything overlaps', () => {
      const a = { minLat: 48.0, maxLat: 48.5, minLng: 11.0, maxLng: 11.5 };
      const b = { minLat: 48.2, maxLat: 48.7, minLng: 11.2, maxLng: 11.7 };
      const result = densestClusterBounds([a, b]);
      expect(result).toEqual({ minLat: 48.0, maxLat: 48.7, minLng: 11.0, maxLng: 11.7 });
    });

    it('large bounding box should NOT win over a cluster of small tracks', () => {
      const munichRun1 = { minLat: 48.12, maxLat: 48.15, minLng: 11.55, maxLng: 11.58 };
      const munichRun2 = { minLat: 48.13, maxLat: 48.16, minLng: 11.56, maxLng: 11.59 };
      const munichRun3 = { minLat: 48.11, maxLat: 48.14, minLng: 11.54, maxLng: 11.57 };
      const munichRun4 = { minLat: 48.14, maxLat: 48.17, minLng: 11.57, maxLng: 11.6 };
      const munichRun5 = { minLat: 48.1, maxLat: 48.13, minLng: 11.53, maxLng: 11.56 };
      const alpsBikeRide = { minLat: 47.0, maxLat: 48.2, minLng: 11.0, maxLng: 12.4 };

      const result = densestClusterBounds([
        munichRun1,
        munichRun2,
        munichRun3,
        munichRun4,
        munichRun5,
        alpsBikeRide,
      ]);

      expect(result).not.toBeNull();
      expect(result?.minLat).toBeGreaterThan(48.0);
      expect(result?.maxLat).toBeLessThan(48.5);
      expect(result?.minLng).toBeGreaterThan(11.4);
      expect(result?.maxLng).toBeLessThan(11.7);
    });
  });

  describe(isSegmentIntersectingBounds.name, () => {
    const bounds: GPSBounds = {
      minLng: 10,
      maxLng: 20,
      minLat: 40,
      maxLat: 50,
    };

    it('both endpoints inside bounds', () => {
      expect(isSegmentIntersectingBounds({ from: [12, 42], to: [18, 48], bounds })).toBe(true);
    });

    it('one endpoint inside, one outside', () => {
      expect(isSegmentIntersectingBounds({ from: [15, 45], to: [25, 55], bounds })).toBe(true);
    });

    it('segment crosses bounds diagonally with no endpoint inside', () => {
      expect(isSegmentIntersectingBounds({ from: [5, 35], to: [25, 55], bounds })).toBe(true);
    });

    it('segment entirely outside — bounds between endpoints on one axis only', () => {
      expect(isSegmentIntersectingBounds({ from: [5, 35], to: [5, 55], bounds })).toBe(false);
    });

    it('segment passes above bounds', () => {
      expect(isSegmentIntersectingBounds({ from: [5, 55], to: [25, 55], bounds })).toBe(false);
    });

    it('horizontal segment crossing through bounds', () => {
      expect(isSegmentIntersectingBounds({ from: [5, 45], to: [25, 45], bounds })).toBe(true);
    });

    it('vertical segment crossing through bounds', () => {
      expect(isSegmentIntersectingBounds({ from: [15, 35], to: [15, 55], bounds })).toBe(true);
    });

    it('segment parallel to edge, just inside', () => {
      expect(isSegmentIntersectingBounds({ from: [10, 42], to: [10, 48], bounds })).toBe(true);
    });

    it('segment parallel to edge, just outside', () => {
      expect(isSegmentIntersectingBounds({ from: [9.999, 42], to: [9.999, 48], bounds })).toBe(
        false,
      );
    });

    it('degenerate zero-length segment (point) inside', () => {
      expect(isSegmentIntersectingBounds({ from: [15, 45], to: [15, 45], bounds })).toBe(true);
    });

    it('degenerate zero-length segment (point) outside', () => {
      expect(isSegmentIntersectingBounds({ from: [5, 45], to: [5, 45], bounds })).toBe(false);
    });

    it('segment touches corner of bounds', () => {
      expect(isSegmentIntersectingBounds({ from: [5, 35], to: [10, 40], bounds })).toBe(true);
    });
  });
});
