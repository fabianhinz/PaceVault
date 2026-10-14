import { describe, it, expect } from 'vitest';
import { profileHistoryDomain, profileHistorySeries, sparklinePath } from '@/lib/profileHistory.ts';

const DAY = 86_400_000;
const today = new Date(2026, 9, 12).getTime();
const createdAt = today - 10 * DAY;
const firstSessionDate = today - 400 * DAY;

describe('profileHistorySeries', () => {
  it('returns one point per entry and none at today', () => {
    const series = profileHistorySeries(
      [
        { date: today - 200 * DAY, value: 250 },
        { date: today - 20 * DAY, value: 270 },
      ],
      { firstSessionDate, createdAt, today },
    );
    expect(series.points).toEqual([
      { date: today - 200 * DAY, value: 250 },
      { date: today - 20 * DAY, value: 270 },
    ]);
  });

  it('gives a single point for a single entry', () => {
    const series = profileHistorySeries([{ date: today - 5 * DAY, value: 60 }], {
      firstSessionDate,
      createdAt,
      today,
    });
    expect(series.points).toHaveLength(1);
  });

  it('places an epoch entry on the first session date, or on createdAt without sessions', () => {
    const history = [
      { date: 0, value: 48 },
      { date: today - 3 * DAY, value: 46 },
    ];
    expect(profileHistorySeries(history, { firstSessionDate, createdAt, today }).points[0]).toEqual(
      {
        date: firstSessionDate,
        value: 48,
      },
    );
    expect(
      profileHistorySeries(history, { firstSessionDate: undefined, createdAt, today }).points[0],
    ).toEqual({ date: createdAt, value: 48 });
  });

  it('spans min and max over the whole history', () => {
    const series = profileHistorySeries(
      [
        { date: 0, value: 280 },
        { date: today - 90 * DAY, value: 240 },
        { date: today - 30 * DAY, value: 265 },
      ],
      { firstSessionDate, createdAt, today },
    );
    expect([series.min, series.max]).toEqual([240, 280]);
  });
});

describe('profileHistoryDomain', () => {
  it('runs from the earliest entry across all values to 7 % past today', () => {
    const domain = profileHistoryDomain(
      [[{ date: 0, value: 50 }], [{ date: today - 900 * DAY, value: 70 }]],
      { firstSessionDate, createdAt, today },
    );
    expect(domain).toEqual([today - 900 * DAY, today + 63 * DAY]);
  });

  it('is at least 30 days wide', () => {
    const domain = profileHistoryDomain([[{ date: 0, value: 50 }]], {
      firstSessionDate: undefined,
      createdAt,
      today,
    });
    expect(domain).toEqual([today - 30 * DAY, today + 2.1 * DAY]);
  });
});

describe('sparklinePath', () => {
  const domain: [number, number] = [today - 100 * DAY, today];
  const box = { width: 104, height: 32 };

  it('draws a single entry as a flat line to the right edge', () => {
    const path = sparklinePath([{ date: today - 50 * DAY, value: 60 }], domain, box, today);
    expect(path.line).toBe('M52.0 16.0 H102.0');
    expect(path.lastDot).toEqual({ x: 52, y: 16 });
    expect(path.todayX).toBe(102);
  });

  it('steps at the date of the second entry', () => {
    const path = sparklinePath(
      [
        { date: today - 100 * DAY, value: 250 },
        { date: today - 50 * DAY, value: 270 },
      ],
      domain,
      box,
      today,
    );
    expect(path.line).toBe('M2.0 30.0 H52.0 V2.0 H102.0');
  });

  it('keeps equal values inside the box', () => {
    const path = sparklinePath(
      [
        { date: today - 100 * DAY, value: 0 },
        { date: today - 50 * DAY, value: 0 },
      ],
      domain,
      box,
      today,
    );
    expect(path.lastDot?.y).toBeGreaterThan(0);
    expect(path.lastDot?.y).toBeLessThan(box.height);
  });

  it('draws no line without entries', () => {
    const path = sparklinePath([], domain, box, today);
    expect(path.line).toBe('');
    expect(path.lastDot).toBeUndefined();
  });
});
