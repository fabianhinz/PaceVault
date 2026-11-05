import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { fireEvent } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';
import { mock } from 'vitest-mock-extended';
import { SessionActionsMenu } from '@/components/sessions/session/SessionActionsMenu.tsx';
import { useSessionGps } from '@/queries/sessions/useSessionGps.ts';
import { INITIAL_SEGMENTS_STORE_STATE, useSegmentsStore } from '@/store/segments.ts';
import type { QueryResults } from '@/types.ts';
import { renderWithProviders } from '@testUtils/render.ts';
import { createMatchMedia } from '@testUtils/matchMedia.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockSessionGPS } from '@pacevault/testing/gps.ts';
import { createMockSegment } from '@tests/factories/segments.ts';

vi.mock('@/queries/sessions/useSessionGps.ts', () => ({ useSessionGps: vi.fn() }));

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

const session = createMockTrainingSession({ id: 's1', hasDetailedRecords: true });

const gpsResult = (data: QueryResults['sessionGps']) =>
  mock<UseQueryResult<QueryResults['sessionGps']>>({ data });

const openMenu = () => {
  const view = renderWithProviders(<SessionActionsMenu session={session} />);
  fireEvent.click(view.getByRole('button', { name: 'Session actions' }));
  return view;
};

describe(SessionActionsMenu.name, () => {
  beforeEach(() => {
    window.matchMedia = createMatchMedia(390);
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.mocked(useSessionGps).mockReturnValue(gpsResult(createMockSessionGPS({ sessionId: 's1' })));
    useSegmentsStore.setState(INITIAL_SEGMENTS_STORE_STATE);
  });

  it('offers "Use as reference segment" without a reference segment', () => {
    const view = openMenu();

    expect(view.getByRole('menuitem', { name: 'Use as reference segment' })).toBeInTheDocument();
    expect(view.queryByRole('menuitem', { name: 'Open segment' })).not.toBeInTheDocument();
  });

  it('offers "Open segment" when the session is a reference', () => {
    useSegmentsStore.setState({
      segments: [
        createMockSegment({
          source: { ...createMockSegment().source, sessionId: 's1', kind: 'session' },
        }),
      ],
    });
    const view = openMenu();

    expect(view.getByRole('menuitem', { name: 'Open segment' })).toBeInTheDocument();
    expect(
      view.queryByRole('menuitem', { name: 'Use as reference segment' }),
    ).not.toBeInTheDocument();
  });

  it('offers neither without GPS', () => {
    vi.mocked(useSessionGps).mockReturnValue(gpsResult(null));
    const view = openMenu();

    expect(view.queryByRole('menuitem', { name: 'Open segment' })).not.toBeInTheDocument();
    expect(
      view.queryByRole('menuitem', { name: 'Use as reference segment' }),
    ).not.toBeInTheDocument();
  });
});
