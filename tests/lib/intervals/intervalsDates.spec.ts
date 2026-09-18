import { describe, it, expect } from 'vitest';
import {
  INTERVALS_MIN_DATE,
  buildRangeWindow,
  buildSyncWindow,
  toIntervalsLocalDate,
} from '@/lib/intervals/intervalsDates.ts';

const at = (iso: string): number => new Date(iso).getTime();

describe('toIntervalsLocalDate', () => {
  it('uses the local day, not the UTC day', () => {
    const lateEvening = at('2026-08-23T23:30:00+02:00');
    expect(toIntervalsLocalDate(lateEvening)).toBe('2026-08-23');
    expect(new Date(lateEvening).toISOString().slice(0, 10)).toBe('2026-08-23');
  });

  it('pads month and day', () => {
    expect(toIntervalsLocalDate(at('2026-01-05T12:00:00'))).toBe('2026-01-05');
  });
});

describe('buildRangeWindow', () => {
  const now = at('2026-08-23T12:00:00');

  it('goes back 30 days', () => {
    expect(buildRangeWindow('30d', now)).toEqual({ oldest: '2026-07-24', newest: '2026-08-23' });
  });

  it('goes back 12 months', () => {
    expect(buildRangeWindow('12m', now)).toEqual({ oldest: '2025-08-23', newest: '2026-08-23' });
  });

  it('floors to the minimum date for everything, because oldest is required', () => {
    expect(buildRangeWindow('all', now)).toEqual({
      oldest: INTERVALS_MIN_DATE,
      newest: '2026-08-23',
    });
  });
});

describe('buildSyncWindow', () => {
  const now = at('2026-08-23T12:00:00');

  it('overlaps the last sync by seven days', () => {
    expect(buildSyncWindow(at('2026-08-20T09:00:00'), now)).toEqual({
      oldest: '2026-08-13',
      newest: '2026-08-23',
    });
  });

  it('honours a custom overlap', () => {
    expect(buildSyncWindow(at('2026-08-20T09:00:00'), now, 1)).toEqual({
      oldest: '2026-08-19',
      newest: '2026-08-23',
    });
  });

  it('falls back to the full history when never synced', () => {
    expect(buildSyncWindow(null, now)).toEqual({
      oldest: INTERVALS_MIN_DATE,
      newest: '2026-08-23',
    });
  });

  it('clamps an absurdly old last sync to the minimum date', () => {
    expect(buildSyncWindow(at('1970-01-05T00:00:00'), now).oldest).toBe(INTERVALS_MIN_DATE);
  });
});
