import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { act, fireEvent, within } from '@testing-library/react';
import { SegmentDetail } from '@/components/segments/SegmentDetail.tsx';
import { getSessionRecords } from '@/lib/storage/db.ts';
import { formatDate, formatRaceTime } from '@/lib/format/formatters.ts';
import { passTileLabel } from '@/microcopy/segments.ts';
import type { StoredSegmentPass } from '@/lib/workers/segmentsContract.ts';
import { INITIAL_SEGMENT_FOCUS_STORE_STATE, useSegmentFocusStore } from '@/store/segmentFocus.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { renderWithProviders } from '@testUtils/render.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import {
  createMockMatchedSegment,
  createMockStoredSegmentPass,
} from '@tests/factories/segments.ts';

vi.mock('@/lib/storage/db.ts', () => ({ getSessionRecords: vi.fn() }));

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

const DAY_MS = 86_400_000;
const passes = [
  createMockStoredSegmentPass({ sessionId: 'a', date: 1_767_225_600_000, movingSec: 300 }),
  createMockStoredSegmentPass({
    sessionId: 'b',
    date: 1_767_225_600_000 + DAY_MS,
    movingSec: 280,
  }),
  createMockStoredSegmentPass({
    sessionId: 'c',
    date: 1_767_225_600_000 + 2 * DAY_MS,
    movingSec: 320,
  }),
];
const segment = createMockMatchedSegment({ passes });
const passA = passes[0] ?? createMockStoredSegmentPass();
const passB = passes[1] ?? createMockStoredSegmentPass();
const passC = passes[2] ?? createMockStoredSegmentPass();

const renderDetail = (initialPath: string) =>
  renderWithProviders(<SegmentDetail segment={segment} best={passB} />, { initialPath });

const tileName = (pass: StoredSegmentPass): string =>
  passTileLabel({
    date: formatDate(pass.date),
    time: formatRaceTime(pass.movingSec),
    best: pass.sessionId === passB.sessionId,
  });

const tileOf = (view: ReturnType<typeof renderDetail>, pass: StoredSegmentPass): HTMLElement =>
  view.getByRole('button', { name: tileName(pass) });

const itemName = (sessionId: string, pass: StoredSegmentPass): string =>
  `Run ${sessionId} · ${formatDate(pass.date)}`;

describe(SegmentDetail.name, () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    vi.mocked(getSessionRecords).mockResolvedValue([]);
    useSegmentFocusStore.setState(INITIAL_SEGMENT_FOCUS_STORE_STATE);
    useSessionsStore.setState({
      sessions: passes.map((pass) =>
        createMockTrainingSession({ id: pass.sessionId, name: `Run ${pass.sessionId}` }),
      ),
    });
  });

  it('pins the best tile first and lists the other passes in date order, the latest selected', () => {
    const view = renderDetail('/segments/x');

    const strip = view.getByRole('group', { name: 'Passes' });
    expect(
      within(strip)
        .getAllByRole('button')
        .map((tile) => tile.getAttribute('aria-label')),
    ).toEqual([passB, passA, passC].map(tileName));
    expect(tileOf(view, passC)).toHaveAttribute('aria-pressed', 'true');
    expect(view.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('marks the best pass with its own tone', () => {
    const view = renderDetail('/segments/x');

    expect(tileOf(view, passB)).toHaveAttribute('data-tone', 'best');
  });

  it('selects the pass of the session the page was opened from', () => {
    const view = renderDetail('/segments/x?from=a');

    expect(tileOf(view, passA)).toHaveAttribute('aria-pressed', 'true');
    expect(view.getByRole('button', { name: itemName('a', passA) })).toBeInTheDocument();
  });

  it('moves the selection and the session item to a tapped tile', () => {
    const view = renderDetail('/segments/x');

    fireEvent.click(tileOf(view, passA));

    expect(tileOf(view, passA)).toHaveAttribute('aria-pressed', 'true');
    expect(view.getByRole('button', { name: itemName('a', passA) })).toBeInTheDocument();
  });

  it('clears the map markers when the segment page is left', () => {
    const view = renderDetail('/segments/x');
    act(() =>
      useSegmentFocusStore
        .getState()
        .showExplorerMarkers({ pass: [48.1, 11.5], best: [48.2, 11.6] }),
    );

    view.unmount();

    expect(useSegmentFocusStore.getState().passMarker).toBeNull();
    expect(useSegmentFocusStore.getState().bestMarker).toBeNull();
  });
});
