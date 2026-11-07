import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { fireEvent, waitFor } from '@testing-library/react';
import { mock, type MockProxy } from 'vitest-mock-extended';
import type { UseMutationResult } from '@tanstack/react-query';
import { DeleteSessionDialog } from '@/components/sessions/session/DeleteSessionDialog.tsx';
import { useDeleteSessionMutation } from '@/mutations/sessions/useDeleteSessionMutation.ts';
import { INITIAL_SEGMENTS_STORE_STATE, useSegmentsStore } from '@/store/segments.ts';
import { renderWithProviders } from '@testUtils/render.ts';
import { createMatchMedia } from '@testUtils/matchMedia.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockSegment } from '@tests/factories/segments.ts';

vi.mock('@/mutations/sessions/useDeleteSessionMutation.ts', () => ({
  useDeleteSessionMutation: vi.fn(),
}));

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

type DeleteSessionMutation = UseMutationResult<
  void,
  Error,
  { sessionId: string; segmentIds: string[] }
>;

const session = createMockTrainingSession({ id: 's1' });
const sourceOf = (sessionId: string) => ({ ...createMockSegment().source, sessionId });

const renderDialog = () =>
  renderWithProviders(<DeleteSessionDialog session={session} open onOpenChange={vi.fn()} />);

describe(DeleteSessionDialog.name, () => {
  let deleteSession: MockProxy<DeleteSessionMutation>;

  beforeEach(() => {
    window.matchMedia = createMatchMedia(1440);
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    deleteSession = mock<DeleteSessionMutation>();
    deleteSession.mutateAsync.mockResolvedValue(undefined);
    vi.mocked(useDeleteSessionMutation).mockReturnValue(deleteSession);
    useSegmentsStore.setState(INITIAL_SEGMENTS_STORE_STATE);
  });

  it('names the session by the title the session list shows', () => {
    const view = renderWithProviders(
      <DeleteSessionDialog
        session={createMockTrainingSession({ id: 's1', name: 'Evening Loop' })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      view.getByText(/^Delete "Evening Loop" from .+\? This action cannot be undone\.$/),
    ).toBeInTheDocument();
  });

  it('names an unnamed session by its sport label, never the raw sport key', () => {
    const view = renderWithProviders(
      <DeleteSessionDialog
        session={createMockTrainingSession({ id: 's1', sport: 'cycling' })}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(view.getByText(/^Delete ".+ Ride" from /)).toBeInTheDocument();
    expect(view.queryByText(/cycling/)).not.toBeInTheDocument();
  });

  it('shows no segment note without segments', () => {
    const view = renderDialog();

    expect(view.queryByText(/Also removes/)).not.toBeInTheDocument();
  });

  it("lists the session's segments as plain items and removes them on Delete", async () => {
    useSegmentsStore.setState({
      segments: [
        createMockSegment({
          id: 'hill',
          name: 'Hill',
          distanceMeters: 1400,
          source: sourceOf('s1'),
        }),
        createMockSegment({ id: 'other', name: 'Other', source: sourceOf('s2') }),
        createMockSegment({ id: 'loop', name: 'Loop', source: sourceOf('s1') }),
      ],
    });
    const view = renderDialog();

    expect(view.getByText('Also removes 2 segments')).toBeInTheDocument();
    expect(view.getByText('Hill')).toBeInTheDocument();
    expect(view.getByText('1.4 km')).toBeInTheDocument();
    expect(view.getByText('Loop')).toBeInTheDocument();
    expect(view.queryByText('Other')).not.toBeInTheDocument();
    expect(view.queryByRole('button', { name: 'Hill' })).not.toBeInTheDocument();
    fireEvent.click(view.getByRole('button', { name: 'Delete' }));

    await waitFor(() =>
      expect(deleteSession.mutateAsync).toHaveBeenCalledWith({
        sessionId: 's1',
        segmentIds: ['hill', 'loop'],
      }),
    );
    expect(useSegmentsStore.getState().segments.map((segment) => segment.id)).toEqual(['other']);
  });
});
