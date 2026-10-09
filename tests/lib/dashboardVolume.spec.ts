import { describe, expect, it } from 'vitest';
import {
  cumulativeVolume,
  formatVolume,
  previousVolumeWindow,
  shiftDayKey,
} from '@/lib/dashboardVolume.ts';

const at = (day: string) => new Date(`${day}T10:00:00`).getTime();

const session = (day: string, values: { distance?: number; elevationGain?: number } = {}) => ({
  date: at(day),
  duration: 3600,
  distance: values.distance,
  elevationGain: values.elevationGain,
});

describe('cumulativeVolume', () => {
  it('dashboard distance total stays missing when no session recorded distance', () => {
    const totals = cumulativeVolume(
      [session('2026-03-02'), session('2026-03-03')],
      'distance',
      '2026-03-01',
      ['2026-03-01', '2026-03-03'],
    );
    expect(totals).toEqual([
      { value: 0, recorded: 0, sessions: 0 },
      { value: undefined, recorded: 0, sessions: 2 },
    ]);
    expect(formatVolume('distance', totals[1]?.value)).toBe('--');
  });

  it('adds up day by day, keeps a recorded 0 and counts sessions without the value', () => {
    const sessions = [
      session('2026-02-28', { elevationGain: 500 }),
      session('2026-03-01', { elevationGain: 120 }),
      session('2026-03-02', { elevationGain: 0 }),
      session('2026-03-02'),
      session('2026-03-04', { elevationGain: 80 }),
    ];
    const totals = cumulativeVolume(sessions, 'elevation', '2026-03-01', [
      '2026-03-01',
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
    ]);
    expect(totals).toEqual([
      { value: 120, recorded: 1, sessions: 1 },
      { value: 120, recorded: 2, sessions: 3 },
      { value: 120, recorded: 2, sessions: 3 },
      { value: 200, recorded: 3, sessions: 4 },
    ]);
  });
});

describe('previousVolumeWindow', () => {
  it('covers the same number of days right before the range, across a month end', () => {
    expect(previousVolumeWindow('2026-03-01', 7)).toEqual({
      from: '2026-02-22',
      to: '2026-02-28',
    });
  });

  it('aligns each day of the range with the same day of the window before', () => {
    const before = cumulativeVolume(
      [session('2026-02-22', { distance: 5000 }), session('2026-02-25', { distance: 8000 })],
      'distance',
      previousVolumeWindow('2026-03-01', 7).from,
      ['2026-03-01', '2026-03-04', '2026-03-07'].map((day) => shiftDayKey(day, -7)),
    );
    expect(before.map((total) => total.value)).toEqual([5000, 13000, 13000]);
  });
});
