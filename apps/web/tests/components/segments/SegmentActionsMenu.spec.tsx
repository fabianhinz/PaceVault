import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { fireEvent, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { mock, type MockProxy } from 'vitest-mock-extended';
import type { UseMutationResult } from '@tanstack/react-query';
import { SegmentActionsMenu } from '@/components/segments/SegmentActionsMenu.tsx';
import { useDeleteSegmentMutation } from '@/mutations/segments/useDeleteSegmentMutation.ts';
import { INITIAL_SEGMENTS_STORE_STATE, useSegmentsStore } from '@/store/segments.ts';
import { renderWithProviders } from '@testUtils/render.ts';
import { createMatchMedia } from '@testUtils/matchMedia.ts';
import { createMockSegment } from '@tests/factories/segments.ts';

vi.mock('@/mutations/segments/useDeleteSegmentMutation.ts', () => ({
  useDeleteSegmentMutation: vi.fn(),
}));

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

type DeleteSegmentMutation = UseMutationResult<void, Error, { segmentId: string }>;

const segment = createMockSegment({ id: 'hill', name: 'Hill' });

const LocationProbe = () => {
  const location = useLocation();
  return <output aria-label="location">{`${location.pathname}${location.search}`}</output>;
};

const renderMenu = () =>
  renderWithProviders(
    <>
      <SegmentActionsMenu segment={segment} />
      <LocationProbe />
    </>,
    { initialPath: '/segments/hill' },
  );

const openMenu = (view: ReturnType<typeof renderMenu>) =>
  fireEvent.click(view.getByRole('button', { name: 'Segment actions' }));

describe(SegmentActionsMenu.name, () => {
  let deleteSegment: MockProxy<DeleteSegmentMutation>;

  beforeEach(() => {
    window.matchMedia = createMatchMedia(390);
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    deleteSegment = mock<DeleteSegmentMutation>();
    deleteSegment.mutateAsync.mockResolvedValue(undefined);
    vi.mocked(useDeleteSegmentMutation).mockReturnValue(deleteSegment);
    useSegmentsStore.setState({ segments: [segment] });
  });

  it('renames the segment', async () => {
    const view = renderMenu();

    openMenu(view);
    fireEvent.click(view.getByRole('menuitem', { name: 'Rename' }));
    await waitFor(() => expect(view.getByLabelText('Name')).toHaveValue('Hill'));
    fireEvent.change(view.getByLabelText('Name'), { target: { value: 'Hill sprint' } });
    fireEvent.click(view.getByRole('button', { name: 'Save' }));

    expect(useSegmentsStore.getState().segments[0]?.name).toBe('Hill sprint');
  });

  it('asks, removes the segment and its passes and opens the Segments tab', async () => {
    const view = renderMenu();

    openMenu(view);
    fireEvent.click(view.getByRole('menuitem', { name: 'Delete' }));
    await waitFor(() =>
      expect(
        view.getByText('Delete "Hill"? Your sessions stay — only the segment is removed.'),
      ).toBeInTheDocument(),
    );
    fireEvent.click(view.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(deleteSegment.mutateAsync).toHaveBeenCalledWith({ segmentId: 'hill' }),
    );
    expect(useSegmentsStore.getState().segments).toEqual(INITIAL_SEGMENTS_STORE_STATE.segments);
    expect(view.getByRole('status', { name: 'location', hidden: true })).toHaveTextContent(
      '/?tab=segments',
    );
  });
});
