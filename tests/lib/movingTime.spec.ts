import { describe, expect, it } from 'vitest';
import { movingSeconds } from '@/lib/movingTime.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const ride = (steps: Array<[number, number]>): SessionRecord[] => {
  let timestamp = 0;
  let distance = 0;
  return [
    { timestamp, distance },
    ...steps.map(([dt, dd]) => {
      timestamp += dt;
      distance += dd;
      return { timestamp, distance };
    }),
  ];
};

describe('movingSeconds', () => {
  it('session chart shows a gap while the rider stands still', () => {
    const records = ride([
      [4, 30],
      [4, 30],
      [83, 0],
      [4, 30],
      [20, 0],
      [4, 30],
    ]);
    expect(movingSeconds(records)).toEqual([0, 4, 8, 12, 16, 20, 24]);
  });

  it('keeps a recording gap while moving on the axis', () => {
    const records = ride([
      [4, 30],
      [4, 30],
      [40, 300],
      [4, 30],
    ]);
    expect(movingSeconds(records)).toEqual([0, 4, 8, 48, 52]);
  });

  it('cuts out a device timer pause even when the distance moved on', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, timerTime: 0, distance: 0 },
      { timestamp: 1, timerTime: 1, distance: 3 },
      { timestamp: 2, timerTime: 2, distance: 6 },
      { timestamp: 302, timerTime: 3, distance: 120 },
      { timestamp: 303, timerTime: 4, distance: 123 },
    ];
    expect(movingSeconds(records)).toEqual([0, 1, 2, 3, 4]);
  });
});
