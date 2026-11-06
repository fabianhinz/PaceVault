import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { mock } from 'vitest-mock-extended';
import type { UseQueryResult } from '@tanstack/react-query';
import { useSegmentDetail } from '@/components/segments/hooks/useSegmentDetail.ts';
import { bestPassOf } from '@/components/segments/segmentPasses.ts';
import { useSegmentPasses } from '@/queries/segments/useSegmentPasses.ts';
import { useSegmentsStore } from '@/store/segments.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { emptyCriteria } from '@/lib/filtering/filters.ts';
import type { QueryResults } from '@/types.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';
import {
  createMockSegment,
  createMockSegmentPassesEntry,
  createMockStoredSegmentPass,
} from '@tests/factories/segments.ts';

vi.mock('@/queries/segments/useSegmentPasses.ts', () => ({ useSegmentPasses: vi.fn() }));

const NOW = Date.UTC(2026, 1, 11);
const LAST_MONTH = {
  ...emptyCriteria(),
  time: { kind: 'relative' as const, amount: 30, unit: 'day' as const },
};

const passesResult = (data: QueryResults['segmentPasses']) =>
  mock<UseQueryResult<QueryResults['segmentPasses']>>({ data, isFetching: false });

const renderDetail = (path: string) =>
  renderHookWithProviders(() => useSegmentDetail('segment-1'), { initialPath: path });

describe(useSegmentDetail.name, () => {
  beforeEach(() => {
    useSegmentsStore.setState({ segments: [createMockSegment({ id: 'segment-1' })] });
    useSessionsStore.setState({
      sessions: [
        createMockTrainingSession({ id: 'old-fast', date: NOW - 60 * MS_PER_DAY }),
        createMockTrainingSession({ id: 'recent', date: NOW - 2 * MS_PER_DAY }),
        createMockTrainingSession({ id: 'recent-slow', date: NOW - 5 * MS_PER_DAY }),
      ],
    });
    vi.mocked(useSegmentPasses).mockReturnValue(
      passesResult([
        createMockSegmentPassesEntry({
          segmentId: 'segment-1',
          passes: [
            createMockStoredSegmentPass({ sessionId: 'old-fast', movingSec: 200 }),
            createMockStoredSegmentPass({ sessionId: 'recent', movingSec: 260 }),
            createMockStoredSegmentPass({ sessionId: 'recent-slow', movingSec: 300 }),
          ],
        }),
      ]),
    );
    useFiltersStore.setState({ activeFilter: LAST_MONTH });
  });

  it('counts only passes inside the dashboard filter for count and best', () => {
    const hook = renderDetail('/segments/segment-1');
    const matched = hook.result.current.matched;

    expect(matched?.passes.map((pass) => pass.sessionId)).toEqual(['recent', 'recent-slow']);
    expect(matched === undefined ? undefined : bestPassOf(matched)?.sessionId).toBe('recent');
  });

  it('keeps the pass of the session the page was opened from', () => {
    const hook = renderDetail('/segments/segment-1?from=old-fast');

    expect(hook.result.current.matched?.passes.map((pass) => pass.sessionId)).toEqual([
      'old-fast',
      'recent',
      'recent-slow',
    ]);
  });

  it('gives the segment without passes when none is inside the filter', () => {
    useFiltersStore.setState({
      activeFilter: {
        ...emptyCriteria(),
        time: { kind: 'relative' as const, amount: 1, unit: 'day' as const },
      },
    });
    const hook = renderDetail('/segments/segment-1');

    expect(hook.result.current.segment?.id).toBe('segment-1');
    expect(hook.result.current.matched?.passes).toEqual([]);
  });
});
