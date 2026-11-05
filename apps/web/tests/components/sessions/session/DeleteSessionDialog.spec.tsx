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

  it('shows no segment note without segments', () => {
    const view = renderDialog();

    expect(view.queryByText(/This also removes/)).not.toBeInTheDocument();
  });

  it("names the session's segments and removes them on Delete", async () => {
    useSegmentsStore.setState({
      segments: [
        createMockSegment({ id: 'hill', name: 'Hill', source: sourceOf('s1') }),
        createMockSegment({ id: 'other', name: 'Other', source: sourceOf('s2') }),
        createMockSegment({ id: 'loop', name: 'Loop', source: sourceOf('s1') }),
      ],
    });
    const view = renderDialog();

    expect(
      view.getByText('This also removes 2 segments created from it: "Hill" and "Loop"'),
    ).toBeInTheDocument();
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
