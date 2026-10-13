import { describe, it, expect } from 'vitest';
import { wattsPerKgHistory } from '@/packages/engine/wattsPerKg.ts';

const day = (year: number, month: number, date: number) =>
  new Date(year, month - 1, date).getTime();

describe('wattsPerKgHistory', () => {
  it('is empty when FTP or weight is missing', () => {
    expect(wattsPerKgHistory([], [{ date: 0, value: 70 }])).toEqual([]);
    expect(wattsPerKgHistory([{ date: 0, value: 280 }], [])).toEqual([]);
  });

  it('adds one entry for an FTP-only, a weight-only and a combined change', () => {
    const ftp = [
      { date: day(2026, 1, 1), value: 280 },
      { date: day(2026, 2, 1), value: 300 },
      { date: day(2026, 4, 1), value: 310 },
    ];
    const weight = [
      { date: day(2026, 1, 1), value: 70 },
      { date: day(2026, 3, 1), value: 75 },
      { date: day(2026, 4, 1), value: 62 },
    ];
    expect(wattsPerKgHistory(ftp, weight)).toEqual([
      { date: day(2026, 1, 1), value: 4 },
      { date: day(2026, 2, 1), value: 300 / 70 },
      { date: day(2026, 3, 1), value: 4 },
      { date: day(2026, 4, 1), value: 5 },
    ]);
  });

  it('starts where both have a real entry, without back-filling weight', () => {
    const ftp = [{ date: day(2024, 5, 1), value: 250 }];
    const weight = [{ date: day(2026, 3, 8), value: 50 }];
    expect(wattsPerKgHistory(ftp, weight)).toEqual([{ date: day(2026, 3, 8), value: 5 }]);
  });

  it('starts at date 0 when both values come from onboarding', () => {
    expect(wattsPerKgHistory([{ date: 0, value: 280 }], [{ date: 0, value: 70 }])).toEqual([
      { date: 0, value: 4 },
    ]);
  });
});
