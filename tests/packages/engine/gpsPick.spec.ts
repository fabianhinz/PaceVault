import { describe, it, expect } from 'vitest';
import { segmentIntersectsBounds } from '@/packages/engine/gps.ts';
import type { GPSBounds } from '@/packages/engine/types.ts';

const bounds: GPSBounds = {
  minLng: 10,
  maxLng: 20,
  minLat: 40,
  maxLat: 50,
};

describe('segmentIntersectsBounds', () => {
  it('both endpoints inside bounds', () => {
    expect(segmentIntersectsBounds([12, 42], [18, 48], bounds)).toBe(true);
  });

  it('one endpoint inside, one outside', () => {
    expect(segmentIntersectsBounds([15, 45], [25, 55], bounds)).toBe(true);
  });

  it('segment crosses bounds diagonally with no endpoint inside', () => {
    expect(segmentIntersectsBounds([5, 35], [25, 55], bounds)).toBe(true);
  });

  it('segment entirely outside — bounds between endpoints on one axis only', () => {
    // Segment runs vertically to the left of the box
    expect(segmentIntersectsBounds([5, 35], [5, 55], bounds)).toBe(false);
  });

  it('segment passes above bounds', () => {
    expect(segmentIntersectsBounds([5, 55], [25, 55], bounds)).toBe(false);
  });

  it('horizontal segment crossing through bounds', () => {
    expect(segmentIntersectsBounds([5, 45], [25, 45], bounds)).toBe(true);
  });

  it('vertical segment crossing through bounds', () => {
    expect(segmentIntersectsBounds([15, 35], [15, 55], bounds)).toBe(true);
  });

  it('segment parallel to edge, just inside', () => {
    expect(segmentIntersectsBounds([10, 42], [10, 48], bounds)).toBe(true);
  });

  it('segment parallel to edge, just outside', () => {
    expect(segmentIntersectsBounds([9.999, 42], [9.999, 48], bounds)).toBe(false);
  });

  it('degenerate zero-length segment (point) inside', () => {
    expect(segmentIntersectsBounds([15, 45], [15, 45], bounds)).toBe(true);
  });

  it('degenerate zero-length segment (point) outside', () => {
    expect(segmentIntersectsBounds([5, 45], [5, 45], bounds)).toBe(false);
  });

  it('segment touches corner of bounds', () => {
    expect(segmentIntersectsBounds([5, 35], [10, 40], bounds)).toBe(true);
  });
});
