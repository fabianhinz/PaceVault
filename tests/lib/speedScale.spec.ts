import { describe, expect, it } from 'vitest';
import { percentile, SPEED_PALETTE, speedScale } from '@/lib/speedScale.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const rideAtKmh = (kmh: Array<number | undefined>): SessionRecord[] =>
  kmh.map((value, index) => {
    if (value === undefined) return { timestamp: index };
    return { timestamp: index, speed: value / 3.6 };
  });

const rgbOf = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255})`;
};

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, index) => from + index);

describe('percentile', () => {
  it('interpolates between the neighbouring sorted values', () => {
    expect(percentile([10, 20, 30, 40, 50], 0.5)).toBe(30);
    expect(percentile([10, 20], 0.25)).toBe(12.5);
    expect(percentile([], 0.5)).toBeUndefined();
  });
});

describe('speedScale', () => {
  it('spans the 5th to 99th percentile of moving speed', () => {
    const scale = speedScale(rideAtKmh(range(0, 100)));
    expect(scale?.slowKmh).toBeCloseTo(5.95, 6);
    expect(scale?.fastKmh).toBeCloseTo(99.01, 6);
  });

  it('ignores stops for the range but colours 0 km/h as the slowest colour', () => {
    const scale = speedScale(rideAtKmh([0, 0, 0, 0, 20, 30, 40, undefined]));
    expect(scale?.slowKmh).toBeCloseTo(21, 6);
    expect(scale?.fastKmh).toBeCloseTo(39.8, 6);
    expect(scale?.colorAt(0)).toBe(scale?.colorAt(scale.slowKmh));
    expect(scale?.colorAt(0)).toBe(scale?.colorAt(21));
  });

  it('runs from the zone blue to the zone red and clamps outside the range', () => {
    const scale = speedScale(rideAtKmh(range(0, 100)));
    const first = SPEED_PALETTE[0] ?? '';
    const last = SPEED_PALETTE[SPEED_PALETTE.length - 1] ?? '';
    expect(scale?.colorAt(1)).toBe(scale?.colorAt(-5));
    expect(scale?.colorAt(200)).toBe(scale?.colorAt(99.5));
    expect(scale?.colorAt(1).toLowerCase()).toContain(rgbOf(first));
    expect(scale?.colorAt(200).toLowerCase()).toContain(rgbOf(last));
  });

  it('has no scale without moving speed', () => {
    expect(speedScale(rideAtKmh([undefined, 0, 0]))).toBeUndefined();
  });
});
