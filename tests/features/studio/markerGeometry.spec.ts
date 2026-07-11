import { describe, it, expect } from 'vitest';
import { encode } from '@googlemaps/polyline-codec';
import {
  positionAtDistance,
  distanceAtPosition,
} from '@/features/studio/markers/markerGeometry.ts';

// A ~111 km west→east line along the equator: 0°E → 1°E at latitude 0.
// One degree of longitude at the equator ≈ 111.19 km.
const encodedEquatorLine = encode([
  [0, 0],
  [0, 1],
]);

describe('positionAtDistance', () => {
  it('returns the start point at distance 0', () => {
    const pos = positionAtDistance('r', [encodedEquatorLine], 0);
    expect(pos).not.toBeNull();
    expect(pos?.[0]).toBeCloseTo(0, 4);
    expect(pos?.[1]).toBeCloseTo(0, 4);
  });

  it('interpolates the midpoint at half the segment length', () => {
    const halfM = 111_195 / 2;
    const pos = positionAtDistance('r', [encodedEquatorLine], halfM);
    expect(pos?.[0]).toBeCloseTo(0.5, 2);
    expect(pos?.[1]).toBeCloseTo(0, 4);
  });

  it('clamps past the route end to the last point', () => {
    const pos = positionAtDistance('r', [encodedEquatorLine], 10_000_000);
    expect(pos?.[0]).toBeCloseTo(1, 4);
  });

  it('returns null for an empty route', () => {
    expect(positionAtDistance('r', [], 100)).toBeNull();
  });

  it('spans distance across disconnected segments', () => {
    // Two 1° segments; a distance just past the first lands early in the second.
    const seg1 = encode([
      [0, 0],
      [0, 1],
    ]);
    const seg2 = encode([
      [0, 10],
      [0, 11],
    ]);
    const pos = positionAtDistance('multi', [seg1, seg2], 111_195 + 1000);
    expect(pos?.[0]).toBeGreaterThan(10);
    expect(pos?.[0]).toBeLessThan(10.1);
  });
});

describe('distanceAtPosition', () => {
  it('returns ~0 for a click at the start', () => {
    expect(distanceAtPosition('r', [encodedEquatorLine], [0, 0])).toBeCloseTo(0, 0);
  });

  it('resolves the along-track distance of a point on the line', () => {
    const d = distanceAtPosition('r', [encodedEquatorLine], [0.25, 0]);
    expect(d).toBeCloseTo(111_195 * 0.25, -2);
  });

  it('snaps an off-track click to the nearest point on the line', () => {
    // Clicking north of the 0.5° mark snaps back down to it.
    const d = distanceAtPosition('r', [encodedEquatorLine], [0.5, 0.02]);
    expect(d).toBeCloseTo(111_195 * 0.5, -2);
  });

  it('round-trips with positionAtDistance', () => {
    const target = 111_195 * 0.4;
    const pos = positionAtDistance('r', [encodedEquatorLine], target);
    expect(pos).not.toBeNull();
    if (pos) {
      expect(distanceAtPosition('r', [encodedEquatorLine], pos)).toBeCloseTo(target, -2);
    }
  });

  it('picks the nearer of two disconnected segments', () => {
    const seg1 = encode([
      [0, 0],
      [0, 1],
    ]);
    const seg2 = encode([
      [0, 10],
      [0, 11],
    ]);
    // A click near the second segment's start resolves past the first segment.
    const d = distanceAtPosition('multi', [seg1, seg2], [10.1, 0]);
    expect(d).toBeGreaterThan(111_195);
  });
});
