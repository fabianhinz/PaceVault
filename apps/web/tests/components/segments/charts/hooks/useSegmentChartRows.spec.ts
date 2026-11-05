import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { act, waitFor } from '@testing-library/react';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { useSegmentChartRows } from '@/components/segments/charts/hooks/useSegmentChartRows.ts';
import { getSessionRecords } from '@/lib/storage/db.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';
import {
  createMockMatchedSegment,
  createMockStoredSegmentPass,
} from '@tests/factories/segments.ts';

vi.mock('@/lib/storage/db.ts', () => ({ getSessionRecords: vi.fn() }));

const passes = [
  createMockStoredSegmentPass({ sessionId: 'a', date: 1, durationSec: 300 }),
  createMockStoredSegmentPass({ sessionId: 'b', date: 2, durationSec: 280 }),
  createMockStoredSegmentPass({ sessionId: 'c', date: 3, durationSec: 320 }),
];
const segment = createMockMatchedSegment({ passes });
const passA = passes[0] ?? createMockStoredSegmentPass();
const passB = passes[1] ?? createMockStoredSegmentPass();
const passC = passes[2] ?? createMockStoredSegmentPass();

describe(useSegmentChartRows.name, () => {
  beforeEach(() => {
    vi.mocked(getSessionRecords).mockReset();
  });

  it('keeps loading until every pass in the view has its records', async () => {
    let releaseC: (records: SessionRecord[]) => void = () => undefined;
    vi.mocked(getSessionRecords).mockImplementation((sessionId) => {
      if (sessionId !== 'c') return Promise.resolve([]);
      return new Promise((resolve) => {
        releaseC = resolve;
      });
    });
    const chartRows = renderHookWithProviders(() =>
      useSegmentChartRows({ segment, selected: passA, best: passB }),
    );

    await waitFor(() => expect(getSessionRecords).toHaveBeenCalledWith('c'));
    expect(chartRows.result.current.loading).toBe(true);

    act(() => releaseC([]));

    await waitFor(() => expect(chartRows.result.current.loading).toBe(false));
    expect(chartRows.result.current.selectedPass).toEqual(passA);
  });

  it('loads each pass once, so a newly shown pass needs no load', async () => {
    vi.mocked(getSessionRecords).mockResolvedValue([]);
    const chartRows = renderHookWithProviders(
      (props: { selected: typeof passA }) =>
        useSegmentChartRows({ segment, selected: props.selected, best: passB }),
      { initialProps: { selected: passA } },
    );
    await waitFor(() => expect(chartRows.result.current.loading).toBe(false));

    chartRows.rerender({ selected: passC });

    expect(chartRows.result.current.selectedPass).toEqual(passC);
    expect(getSessionRecords).toHaveBeenCalledTimes(3);
  });
});
