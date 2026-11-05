import { describe, expect, it } from 'vite-plus/test';
import { useSegmentTitle } from '@/components/segments/hooks/useSegmentTitle.ts';
import { segmentInFilter } from '@/components/segments/segmentFilter.ts';
import { emptyCriteria } from '@/lib/filtering/filters.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';
import {
  createMockMatchedSegment,
  createMockSegment,
  createMockStoredSegmentPass,
} from '@tests/factories/segments.ts';

const NOW = Date.UTC(2026, 1, 11, 12);

describe(useSegmentTitle.name, () => {
  it('reads last ridden date, distance, elevation and pass count', () => {
    const segment = createMockMatchedSegment({
      name: 'Isar',
      netElevationMeters: 12,
      lastPassDate: Date.UTC(2026, 0, 15, 12),
    });

    const hook = renderHookWithProviders(() => useSegmentTitle(segment));

    expect(hook.result.current).toEqual({
      title: 'Isar',
      subtitle: 'Jan 15, 2026 · 1.0 km · +12 m · 2 passes',
    });
  });

  it('leaves out date and count while no passes are known', () => {
    const hook = renderHookWithProviders(() =>
      useSegmentTitle(createMockSegment({ name: 'Isar' })),
    );

    expect(hook.result.current).toEqual({ title: 'Isar', subtitle: '1.0 km · 0 m' });
  });

  it('leaves out the date when no pass is left', () => {
    const segment = createMockMatchedSegment({ passes: [], lastPassDate: null });

    const hook = renderHookWithProviders(() => useSegmentTitle(segment));

    expect(hook.result.current.subtitle).toBe('1.0 km · 0 m · 0 passes');
  });

  it('counts only the passes inside the filter', () => {
    const filtered = segmentInFilter({
      segment: createMockMatchedSegment({
        passes: [
          createMockStoredSegmentPass({ sessionId: 'old', date: NOW - 60 * MS_PER_DAY }),
          createMockStoredSegmentPass({ sessionId: 'new', date: NOW - 2 * MS_PER_DAY }),
        ],
      }),
      sessionsById: new Map([
        ['old', createMockTrainingSession({ id: 'old', date: NOW - 60 * MS_PER_DAY })],
        ['new', createMockTrainingSession({ id: 'new', date: NOW - 2 * MS_PER_DAY })],
      ]),
      criteria: {
        ...emptyCriteria(),
        time: { kind: 'relative' as const, amount: 30, unit: 'day' as const },
      },
      now: NOW,
      keptSessionId: null,
    });

    const hook = renderHookWithProviders(() => useSegmentTitle(filtered));

    expect(hook.result.current.subtitle).toBe('Feb 9, 2026 · 1.0 km · 0 m · 1 pass');
  });
});
