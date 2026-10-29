import { describe, it, expect } from 'vite-plus/test';
import { initialBearingDegrees } from '../src/geodesy.ts';

describe(initialBearingDegrees.name, () => {
  const origin = { lat: 0, lng: 0 };

  it('points north as 0°', () => {
    expect(initialBearingDegrees({ from: origin, to: { lat: 1, lng: 0 } })).toBeCloseTo(0, 1);
  });

  it('points east as 90°', () => {
    expect(initialBearingDegrees({ from: origin, to: { lat: 0, lng: 1 } })).toBeCloseTo(90, 1);
  });

  it('points south as 180°', () => {
    expect(initialBearingDegrees({ from: origin, to: { lat: -1, lng: 0 } })).toBeCloseTo(180, 1);
  });

  it('points west as 270°', () => {
    expect(initialBearingDegrees({ from: origin, to: { lat: 0, lng: -1 } })).toBeCloseTo(270, 1);
  });

  it('points northeast as ~45° near the equator', () => {
    expect(initialBearingDegrees({ from: origin, to: { lat: 1, lng: 1 } })).toBeCloseTo(45, 0);
  });

  it('always returns a value within [0, 360)', () => {
    const b = initialBearingDegrees({ from: { lat: 48, lng: 11 }, to: { lat: 47.9, lng: 10.9 } });
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});
