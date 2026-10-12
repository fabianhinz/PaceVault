import { describe, it, expect } from 'vitest';
import {
  profileHistoryDomain,
  profileHistoryRows,
  profileHistorySeries,
} from '@/lib/profileHistory.ts';

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
  it('runs from the earliest entry across all values to today', () => {
    const domain = profileHistoryDomain(
      [[{ date: 0, value: 50 }], [{ date: today - 900 * DAY, value: 70 }]],
      { firstSessionDate, createdAt, today },
    );
    expect(domain).toEqual([today - 900 * DAY, today]);
  });

  it('is at least 30 days wide', () => {
    const domain = profileHistoryDomain([[{ date: 0, value: 50 }]], {
      firstSessionDate: undefined,
      createdAt,
      today,
    });
    expect(domain).toEqual([today - 30 * DAY, today]);
  });
});

describe('profileHistoryRows', () => {
  it('hovering between entries lands on that day, not on the nearest entry', () => {
    const rows = profileHistoryRows(
      [
        { date: today - 20 * DAY, value: 250 },
        { date: today - 2 * DAY, value: 270 },
      ],
      [today - 30 * DAY, today],
    );
    expect(rows).toHaveLength(31);
    expect(rows.find((row) => row.date === today - 10 * DAY)?.value).toBeNull();
    expect(rows.filter((row) => row.value !== null && !row.carried)).toEqual([
      { date: today - 20 * DAY, value: 250, carried: false },
      { date: today - 2 * DAY, value: 270, carried: false },
    ]);
  });

  it('carries the last value forward to today, also for a single entry', () => {
    const rows = profileHistoryRows(
      [{ date: today - 20 * DAY, value: 250 }],
      [today - 30 * DAY, today],
    );
    expect(rows.at(-1)).toEqual({ date: today, value: 250, carried: true });
    expect(rows.filter((row) => row.value !== null)).toHaveLength(2);
  });

  it('adds no carried row when the last entry is today', () => {
    const rows = profileHistoryRows([{ date: today, value: 250 }], [today - 30 * DAY, today]);
    expect(rows.filter((row) => row.carried)).toEqual([]);
  });
});
