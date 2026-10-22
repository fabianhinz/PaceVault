import { describe, it, expect } from 'vite-plus/test';
import { getMondayOfWeek, buildPlanCacheKey, loadBucketDayRange } from '@/lib/weekKey.ts';

describe('getMondayOfWeek', () => {
  it('returns the same date when input is a Monday', () => {
    expect(getMondayOfWeek('2026-02-09')).toBe('2026-02-09');
  });

  it('returns previous Monday for a mid-week date', () => {
    expect(getMondayOfWeek('2026-02-11')).toBe('2026-02-09');
  });

  it('returns previous Monday for a Sunday', () => {
    expect(getMondayOfWeek('2026-02-15')).toBe('2026-02-09');
  });

  it('handles year boundary (Jan 1 is Thursday)', () => {
    expect(getMondayOfWeek('2026-01-01')).toBe('2025-12-29');
  });

  it('handles month boundary', () => {
    expect(getMondayOfWeek('2026-03-01')).toBe('2026-02-23');
  });

  it('returns Saturday Monday correctly', () => {
    expect(getMondayOfWeek('2026-02-14')).toBe('2026-02-09');
  });
});

describe('buildPlanCacheKey', () => {
  it('starts with week, session count and threshold pace', () => {
    expect(buildPlanCacheKey('2026-02-09', [40, 65.5], 300)).toMatch(/^2026-02-09:2:300:/);
    expect(buildPlanCacheKey('2026-02-09', [], 300)).toMatch(/^2026-02-09:0:300:/);
  });

  it('stays the same for the same loads', () => {
    expect(buildPlanCacheKey('2026-02-09', [40, 65.5], 300)).toBe(
      buildPlanCacheKey('2026-02-09', [40, 65.5], 300),
    );
  });

  it('changes when a recompute moves a stored load', () => {
    const before = buildPlanCacheKey('2026-02-09', [40, 65.5], 300);
    expect(buildPlanCacheKey('2026-02-09', [40, 71.2], 300)).not.toBe(before);
    expect(buildPlanCacheKey('2026-02-16', [40, 65.5], 300)).not.toBe(before);
    expect(buildPlanCacheKey('2026-02-09', [40, 65.5, 20], 300)).not.toBe(before);
  });
});

describe('loadBucketDayRange', () => {
  it('dashboard zoom on weekly or monthly load buckets keeps the whole last bucket', () => {
    expect(loadBucketDayRange('2026-02-09', 'week')).toEqual({
      from: '2026-02-09',
      to: '2026-02-15',
    });
    expect(loadBucketDayRange('2026-02', 'month')).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
    expect(loadBucketDayRange('2026-02-11', 'day')).toEqual({
      from: '2026-02-11',
      to: '2026-02-11',
    });
  });
});
