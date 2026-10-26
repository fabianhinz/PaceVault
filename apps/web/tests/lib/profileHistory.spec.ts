import { describe, it, expect } from 'vite-plus/test';
import { profileHistoryDomain, profileHistorySeries, sparklinePath } from '@/lib/profileHistory.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

const today = new Date(2026, 9, 12).getTime();
const createdAt = today - 10 * MS_PER_DAY;
const firstSessionDate = today - 400 * MS_PER_DAY;

describe(profileHistorySeries.name, () => {
  it('returns one point per entry and none at today', () => {
    const series = profileHistorySeries({
      history: [
        { date: today - 200 * MS_PER_DAY, value: 250 },
        { date: today - 20 * MS_PER_DAY, value: 270 },
      ],
      context: { firstSessionDate, createdAt, today },
    });
    expect(series.points).toEqual([
      { date: today - 200 * MS_PER_DAY, value: 250 },
      { date: today - 20 * MS_PER_DAY, value: 270 },
    ]);
  });

  it('gives a single point for a single entry', () => {
    const series = profileHistorySeries({
      history: [{ date: today - 5 * MS_PER_DAY, value: 60 }],
      context: {
        firstSessionDate,
        createdAt,
        today,
      },
    });
    expect(series.points).toHaveLength(1);
  });

  it('places an epoch entry on the first session date, or on createdAt without sessions', () => {
    const history = [
      { date: 0, value: 48 },
      { date: today - 3 * MS_PER_DAY, value: 46 },
    ];
    expect(
      profileHistorySeries({ history, context: { firstSessionDate, createdAt, today } }).points[0],
    ).toEqual({
      date: firstSessionDate,
      value: 48,
    });
    expect(
      profileHistorySeries({ history, context: { firstSessionDate: undefined, createdAt, today } })
        .points[0],
    ).toEqual({ date: createdAt, value: 48 });
  });

  it('spans min and max over the whole history', () => {
    const series = profileHistorySeries({
      history: [
        { date: 0, value: 280 },
        { date: today - 90 * MS_PER_DAY, value: 240 },
        { date: today - 30 * MS_PER_DAY, value: 265 },
      ],
      context: { firstSessionDate, createdAt, today },
    });
    expect([series.min, series.max]).toEqual([240, 280]);
  });
});

describe(profileHistoryDomain.name, () => {
  it('runs from the earliest entry across all values to 7 % past today', () => {
    const domain = profileHistoryDomain({
      histories: [[{ date: 0, value: 50 }], [{ date: today - 900 * MS_PER_DAY, value: 70 }]],
      context: { firstSessionDate, createdAt, today },
    });
    expect(domain).toEqual([today - 900 * MS_PER_DAY, today + 63 * MS_PER_DAY]);
  });

  it('is at least 30 days wide', () => {
    const domain = profileHistoryDomain({
      histories: [[{ date: 0, value: 50 }]],
      context: {
        firstSessionDate: undefined,
        createdAt,
        today,
      },
    });
    expect(domain).toEqual([today - 30 * MS_PER_DAY, today + 2.1 * MS_PER_DAY]);
  });
});

describe(sparklinePath.name, () => {
  const domain: [number, number] = [today - 100 * MS_PER_DAY, today];
  const box = { width: 104, height: 32 };

  it('draws a single entry as a flat line to the right edge', () => {
    const path = sparklinePath({
      points: [{ date: today - 50 * MS_PER_DAY, value: 60 }],
      domain,
      box,
      today,
    });
    expect(path.line).toBe('M52.0 16.0 H102.0');
    expect(path.lastDot).toEqual({ x: 52, y: 16 });
    expect(path.todayX).toBe(102);
  });

  it('steps at the date of the second entry', () => {
    const path = sparklinePath({
      points: [
        { date: today - 100 * MS_PER_DAY, value: 250 },
        { date: today - 50 * MS_PER_DAY, value: 270 },
      ],
      domain,
      box,
      today,
    });
    expect(path.line).toBe('M2.0 30.0 H52.0 V2.0 H102.0');
  });

  it('keeps equal values inside the box', () => {
    const path = sparklinePath({
      points: [
        { date: today - 100 * MS_PER_DAY, value: 0 },
        { date: today - 50 * MS_PER_DAY, value: 0 },
      ],
      domain,
      box,
      today,
    });
    expect(path.lastDot?.y).toBeGreaterThan(0);
    expect(path.lastDot?.y).toBeLessThan(box.height);
  });

  it('draws no line without entries', () => {
    const path = sparklinePath({ points: [], domain, box, today });
    expect(path.line).toBe('');
    expect(path.lastDot).toBeUndefined();
  });
});
