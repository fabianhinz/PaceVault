import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { mock, type MockProxy } from 'vitest-mock-extended';
import { useSaveSegment } from '@/components/segments/hooks/useSaveSegment.ts';
import { SEGMENTS_SNACKBARS } from '@/components/segments/segmentsSnackbars.ts';
import { usePageRouting, type PageRouting } from '@/routing/usePageRouting.ts';
import { useSnackbar, type Snackbar } from '@/lib/hooks/useSnackbar.ts';
import { INITIAL_SEGMENTS_STORE_STATE, useSegmentsStore } from '@/store/segments.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';
import { createMockSegment } from '@tests/factories/segments.ts';

vi.mock('@/routing/usePageRouting.ts', () => ({ usePageRouting: vi.fn() }));
vi.mock('@/lib/hooks/useSnackbar.ts', () => ({ useSnackbar: vi.fn() }));

describe(useSaveSegment.name, () => {
  let pageRouting: MockProxy<PageRouting>;
  let snackbar: MockProxy<Snackbar>;

  beforeEach(() => {
    pageRouting = mock<PageRouting>();
    snackbar = mock<Snackbar>();
    vi.mocked(usePageRouting).mockReturnValue(pageRouting);
    vi.mocked(useSnackbar).mockReturnValue(snackbar);
    useSegmentsStore.setState(INITIAL_SEGMENTS_STORE_STATE);
  });

  it('adds the segment and opens its page', () => {
    const segment = createMockSegment({ id: 'new' });
    const hook = renderHookWithProviders(() => useSaveSegment());

    hook.result.current.save(segment);

    expect(useSegmentsStore.getState().segments).toEqual([segment]);
    expect(pageRouting.open).toHaveBeenCalledWith({
      page: 'segmentDetail',
      params: { segmentId: 'new' },
    });
  });

  it('adds nothing and shows the no-GPS snackbar without a draft', () => {
    const hook = renderHookWithProviders(() => useSaveSegment());

    hook.result.current.save(null);

    expect(useSegmentsStore.getState().segments).toEqual([]);
    expect(snackbar.enqueueSnackbar).toHaveBeenCalledWith(SEGMENTS_SNACKBARS.noGps);
    expect(pageRouting.open).not.toHaveBeenCalled();
  });
});
