import { describe, it, expect } from 'vite-plus/test';
import { secondsInZones } from '@/packages/engine/zoneDistribution.ts';

const zoneIndexAt = (hr: number): number => {
  if (hr < 150) return 0;
  return 1;
};

describe('secondsInZones', () => {
  it('weights each record by its interval on smart recording and skips a 30 s gap', () => {
    const records = [
      { timestamp: 0, hr: 140 },
      { timestamp: 1, hr: 140 },
      { timestamp: 5, hr: 160 },
      { timestamp: 35, hr: 160 },
      { timestamp: 38, hr: 140 },
    ];
    expect(secondsInZones(records, zoneIndexAt, 2)).toEqual([4, 4]);
  });
});
