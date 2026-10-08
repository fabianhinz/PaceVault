import { describe, it, expect, afterEach } from 'vitest';
import { formatCustomRangeDuration, getTimeRangeOptions } from '@/lib/timeRange.ts';
import { overwriteGetLocale } from '@/paraglide/runtime.js';

describe('formatCustomRangeDuration', () => {
  afterEach(() => {
    overwriteGetLocale(() => 'en');
  });

  it('returns ~Xd for single-day range', () => {
    expect(formatCustomRangeDuration({ from: '2026-01-15', to: '2026-01-15' })).toBe('~1d');
  });

  it('returns ~Xd for a two-week range', () => {
    expect(formatCustomRangeDuration({ from: '2026-01-01', to: '2026-01-14' })).toBe('~14d');
  });

  it('returns ~Xd at the 99-day boundary', () => {
    expect(formatCustomRangeDuration({ from: '2026-01-01', to: '2026-04-09' })).toBe('~99d');
  });

  it('returns ~Xm for ranges over 99 days', () => {
    expect(formatCustomRangeDuration({ from: '2026-01-01', to: '2026-04-10' })).toBe('~3m');
  });

  it('returns ~Xm for a full year', () => {
    expect(formatCustomRangeDuration({ from: '2025-01-01', to: '2025-12-31' })).toBe('~12m');
  });

  it('custom range duration is localised in the German UI', () => {
    overwriteGetLocale(() => 'de');

    expect(formatCustomRangeDuration({ from: '2026-01-01', to: '2026-01-28' })).toMatch(/^≈28\sT$/);
    expect(formatCustomRangeDuration({ from: '2025-01-01', to: '2025-12-31' })).toMatch(/^≈12\sM$/);
  });

  it('result is always ≤ 5 chars', () => {
    const cases = [
      { from: '2026-01-01', to: '2026-01-01' },
      { from: '2026-01-01', to: '2026-01-14' },
      { from: '2026-01-01', to: '2026-04-09' },
      { from: '2026-01-01', to: '2026-07-01' },
      { from: '2025-01-01', to: '2025-12-31' },
    ];
    for (const locale of ['en', 'de'] as const) {
      overwriteGetLocale(() => locale);
      for (const range of cases) {
        expect(formatCustomRangeDuration(range).length).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe('getTimeRangeOptions', () => {
  afterEach(() => {
    overwriteGetLocale(() => 'en');
  });

  it('fixed and custom range labels share one format in the German UI', () => {
    overwriteGetLocale(() => 'de');

    const fixedLabels = getTimeRangeOptions()
      .filter((option) => option.value !== 'all')
      .map((option) => option.label);
    const customLabel = formatCustomRangeDuration({ from: '2026-01-01', to: '2026-01-07' });

    expect(fixedLabels.map((label) => label.replace(/\s/, ' '))).toEqual(['7 T', '30 T', '90 T']);
    expect(customLabel).toBe(`≈${fixedLabels[0]}`);
  });
});
