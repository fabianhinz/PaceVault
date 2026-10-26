import { describe, it, expect } from 'vite-plus/test';
import { aerobicDecoupling } from '../src/decoupling.ts';
import { windowedGradients } from '../src/gradient.ts';
import type { SessionRecord } from '../src/types.ts';
import { createMockSessionRecord } from '../../testing/src/records.ts';

const HOUR_S = 3600;

const halves = <T>(i: number, seconds: number, first: T, second: T): T => {
  if (i <= seconds / 2) return first;
  return second;
};

const ride = (
  seconds: number,
  hr: [number, number],
  power: [number | undefined, number | undefined] = [200, 200],
): SessionRecord[] =>
  Array.from({ length: seconds + 1 }, (_, i) =>
    createMockSessionRecord({
      timestamp: i,
      speed: 8,
      hr: halves(i, seconds, hr[0], hr[1]),
      power: halves(i, seconds, power[0], power[1]),
    }),
  );

const run = (seconds: number): SessionRecord[] =>
  Array.from({ length: seconds + 1 }, (_, i) =>
    createMockSessionRecord({
      timestamp: i,
      speed: 3,
      distance: i * 3,
      hr: halves(i, seconds, 150, 155),
    }),
  );

describe(aerobicDecoupling.name, () => {
  it('measures Pw:HR drift when HR rises at steady power', () => {
    const records = ride(HOUR_S, [140, 147]);
    const result = aerobicDecoupling({
      records,
      sport: 'cycling',
      gradients: windowedGradients(records),
    });
    expect(result?.ratio).toBe('powerHr');
    expect(result?.pct).toBeCloseTo(4.76, 2);
  });

  it('keeps the sign when HR falls', () => {
    const records = ride(HOUR_S, [147, 140]);
    expect(
      aerobicDecoupling({ records, sport: 'cycling', gradients: windowedGradients(records) })
        ?.pct ?? NaN,
    ).toBeLessThan(0);
  });

  it('uses GAP:HR on a run with gradients', () => {
    const records = run(HOUR_S);
    const result = aerobicDecoupling({
      records,
      sport: 'running',
      gradients: records.map(() => 0.05),
    });
    expect(result?.ratio).toBe('gapHr');
    expect(result?.pct).toBeCloseTo((1 - 150 / 155) * 100, 6);
  });

  it('falls back to Speed:HR on a run without elevation', () => {
    const records = run(HOUR_S);
    expect(
      aerobicDecoupling({ records, sport: 'running', gradients: windowedGradients(records) })
        ?.ratio,
    ).toBe('speedHr');
  });

  it('is undefined below 60 min of counted data', () => {
    const records = ride(59 * 60, [140, 147]);
    expect(
      aerobicDecoupling({ records, sport: 'cycling', gradients: windowedGradients(records) }),
    ).toBeUndefined();
  });

  it('is undefined on a ride without power', () => {
    const records = ride(HOUR_S, [140, 147], [undefined, undefined]);
    expect(
      aerobicDecoupling({ records, sport: 'cycling', gradients: windowedGradients(records) }),
    ).toBeUndefined();
  });

  it('is null when the first half is at 0 W', () => {
    const records = ride(HOUR_S, [140, 147], [0, 200]);
    expect(
      aerobicDecoupling({ records, sport: 'cycling', gradients: windowedGradients(records) }),
    ).toBeNull();
  });
});
