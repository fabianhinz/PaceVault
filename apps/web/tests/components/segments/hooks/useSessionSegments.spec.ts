import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { useSessionSegments } from '@/components/segments/hooks/useSessionSegments.ts';
import { useSegments } from '@/components/segments/hooks/useSegments.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { emptyCriteria } from '@/lib/filtering/filters.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';
import {
  createMockMatchedSegment,
  createMockStoredSegmentPass,
} from '@tests/factories/segments.ts';

vi.mock('@/components/segments/hooks/useSegments.ts', () => ({ useSegments: vi.fn() }));

const NOW = Date.UTC(2026, 1, 11);

describe(useSessionSegments.name, () => {
  beforeEach(() => {
    useFiltersStore.setState({ activeFilter: null });
    useSessionsStore.setState({
      sessions: [
        createMockTrainingSession({ id: 'old-fast', date: NOW - 60 * MS_PER_DAY }),
        createMockTrainingSession({ id: 'old-viewed', date: NOW - 50 * MS_PER_DAY }),
        createMockTrainingSession({ id: 'recent', date: NOW - 2 * MS_PER_DAY }),
      ],
    });
    vi.mocked(useSegments).mockReturnValue([
      createMockMatchedSegment({
        passes: [
          createMockStoredSegmentPass({ sessionId: 'old-fast', durationSec: 200 }),
          createMockStoredSegmentPass({ sessionId: 'old-viewed', durationSec: 280 }),
          createMockStoredSegmentPass({ sessionId: 'recent', durationSec: 260 }),
        ],
      }),
    ]);
  });

  it('ranks among all passes without a filter', () => {
    const hook = renderHookWithProviders(() => useSessionSegments('old-viewed'));

    expect(hook.result.current?.[0]?.rank).toBe(3);
    expect(hook.result.current?.[0]?.segment.passes).toHaveLength(3);
  });

  it('ranks among the passes inside the filter and keeps the viewed session', () => {
    useFiltersStore.setState({
      activeFilter: {
        ...emptyCriteria(),
        time: { kind: 'relative' as const, amount: 30, unit: 'day' as const },
      },
    });
    const hook = renderHookWithProviders(() => useSessionSegments('old-viewed'));

    expect(hook.result.current?.[0]?.rank).toBe(2);
    expect(hook.result.current?.[0]?.segment.passes.map((pass) => pass.sessionId)).toEqual([
      'old-viewed',
      'recent',
    ]);
  });
});
