import { afterEach, describe, expect, it } from 'vitest';
import {
  beforeVolumeWindow,
  cumulativeVolume,
  formatVolume,
  formatVolumeTick,
  formatVolumeWindow,
  volumeAxisTicks,
  volumeTotals,
  volumeYAxisWidth,
} from '@/lib/dashboardVolume.ts';
import { overwriteGetLocale } from '@/paraglide/runtime.js';

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
      { value: undefined, recorded: 0, sessions: 0 },
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

  it('cumulative volume carries forward over days without a recorded value', () => {
    const sessions = [
      session('2026-03-01'),
      session('2026-03-02', { elevationGain: 0 }),
      session('2026-03-04'),
      session('2026-03-06', { elevationGain: 150 }),
    ];
    const totals = cumulativeVolume(sessions, 'elevation', '2026-02-28', [
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
    ]);
    expect(totals.map((total) => total.value)).toEqual([undefined, undefined, 0, 0, 0, 0, 150]);
  });
});

describe('volume y-axis', () => {
  it('volume y-axis labels fit the widest tick instead of being cut', () => {
    overwriteGetLocale(() => 'de');
    const ticks = volumeAxisTicks([null, 12, 87_300]);
    expect(ticks?.map(formatVolumeTick)).toEqual(['0', '50.000', '100.000']);
    expect(volumeYAxisWidth(ticks)).toBeGreaterThan(volumeYAxisWidth([0, 50, 100]));
    expect(volumeAxisTicks([null, null])).toBeUndefined();
    overwriteGetLocale(() => 'en');
  });
});

describe('beforeVolumeWindow', () => {
  const week = ['2026-03-01', '2026-03-04', '2026-03-07'];

  it('compares a relative filter with the same number of days right before it', () => {
    const before = beforeVolumeWindow(
      { kind: 'relative', amount: 7, unit: 'day' },
      '2026-03-01',
      7,
      week,
    );
    expect(before).toEqual({
      from: '2026-02-22',
      through: ['2026-02-22', '2026-02-25', '2026-02-28'],
    });
    const totals = cumulativeVolume(
      [session('2026-02-22', { distance: 5000 }), session('2026-02-25', { distance: 8000 })],
      'distance',
      before.from,
      before.through,
    );
    expect(totals.map((total) => total.value)).toEqual([5000, 13000, 13000]);
  });

  it('compares a chart zoom with the same number of days right before it', () => {
    const zoom = { kind: 'range', from: '2026-03-01', to: '2026-03-07', source: 'zoom' } as const;
    expect(beforeVolumeWindow(zoom, '2026-03-01', 7, week).from).toBe('2026-02-22');
  });

  it('compares a calendar year with the same dates last year', () => {
    expect(
      beforeVolumeWindow({ kind: 'calendarYear', yearsAgo: 0 }, '2026-01-01', 70, [
        '2026-01-01',
        '2026-03-11',
      ]),
    ).toEqual({
      from: '2025-01-01',
      through: ['2025-01-01', '2025-03-11'],
    });
  });

  it('compares a month range with the same months last year', () => {
    const months = {
      kind: 'range',
      from: '2025-09-01',
      to: '2025-10-31',
      source: 'months',
    } as const;
    expect(beforeVolumeWindow(months, '2025-09-01', 61, ['2025-09-01', '2025-10-31'])).toEqual({
      from: '2024-09-01',
      through: ['2024-09-01', '2024-10-31'],
    });
  });

  it('clamps 29 February to 28 February and still counts a leap-day session of last year', () => {
    const leapFebruary = {
      kind: 'range',
      from: '2028-02-01',
      to: '2028-02-29',
      source: 'month',
    } as const;
    expect(
      beforeVolumeWindow(leapFebruary, '2028-02-01', 29, ['2028-02-28', '2028-02-29']).through,
    ).toEqual(['2027-02-28', '2027-02-28']);

    const spring = {
      kind: 'range',
      from: '2025-02-01',
      to: '2025-03-31',
      source: 'months',
    } as const;
    const before = beforeVolumeWindow(spring, '2025-02-01', 59, ['2025-02-28', '2025-03-01']);
    const totals = cumulativeVolume(
      [session('2024-02-29', { distance: 10000 })],
      'distance',
      before.from,
      before.through,
    );
    expect(totals.map((total) => total.value)).toEqual([undefined, 10000]);
  });
});

describe('volumeTotals', () => {
  afterEach(() => {
    overwriteGetLocale(() => 'en');
  });

  it('volume row shows the whole history when no time filter is active', () => {
    const sessions = [
      session('2025-11-02', { distance: 8000 }),
      session('2026-01-15', { distance: 12000 }),
      session('2026-03-04', { distance: 5000 }),
    ];
    const totals = volumeTotals(sessions, 'distance', null, null, [
      '2025-11-02',
      '2026-01-15',
      '2026-03-04',
      '2026-03-10',
    ]);
    expect(totals.current.map((total) => total.value)).toEqual([8000, 20000, 25000, 25000]);
    expect(totals.current[3]?.sessions).toBe(3);
    expect(totals.before).toBeNull();
    expect(totals.beforeWindow).toBeNull();
  });

  it('labels the comparison range of a time filter', () => {
    const totals = volumeTotals(
      [session('2025-10-05', { distance: 5000 })],
      'distance',
      { kind: 'relative', amount: 7, unit: 'day' },
      { from: '2025-10-10', count: 7 },
      ['2025-10-10', '2025-10-16'],
    );
    expect(totals.before?.map((total) => total.value)).toEqual([undefined, 5000]);
    if (totals.beforeWindow === null) {
      throw new Error('comparison missing');
    }
    overwriteGetLocale(() => 'de');
    expect(formatVolumeWindow(totals.beforeWindow)).toBe('3.–9. Okt. 2025');
  });
});
