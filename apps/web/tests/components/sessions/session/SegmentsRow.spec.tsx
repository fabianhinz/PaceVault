import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { fireEvent, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { SegmentsRow } from '@/components/sessions/session/SegmentsRow.tsx';
import { useSessionSegments } from '@/components/segments/hooks/useSessionSegments.ts';
import { renderWithProviders } from '@testUtils/render.ts';
import { createMatchMedia } from '@testUtils/matchMedia.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import {
  createMockMatchedSegment,
  createMockStoredSegmentPass,
} from '@tests/factories/segments.ts';

vi.mock('@/components/segments/hooks/useSessionSegments.ts', () => ({
  useSessionSegments: vi.fn(),
}));

const session = createMockTrainingSession({ id: 's1' });
const records = Array.from({ length: 400 }, (_, i) => createMockSessionRecord({ timestamp: i }));
const pass = createMockStoredSegmentPass({
  sessionId: 's1',
  startTimestampSec: 100,
  endTimestampSec: 300,
});
const segment = createMockMatchedSegment({ id: 'segment:1', name: 'Hill', passes: [pass] });

const LocationProbe = () => {
  const location = useLocation();
  return <output aria-label="location">{`${location.pathname}${location.search}`}</output>;
};

const renderRow = () =>
  renderWithProviders(
    <>
      <SegmentsRow session={session} records={records} />
      <LocationProbe />
    </>,
    { initialPath: '/sessions/s1' },
  );

describe(SegmentsRow.name, () => {
  beforeEach(() => {
    vi.mocked(useSessionSegments).mockReturnValue([{ segment, pass, rank: 1 }]);
    window.matchMedia = createMatchMedia(1440);
  });

  it('opens the segment page with the session as origin on click', async () => {
    const view = renderRow();

    fireEvent.click(view.getByRole('button', { name: 'Hill' }));

    await waitFor(() =>
      expect(view.getByRole('status', { name: 'location' })).toHaveTextContent(
        '/segments/segment%3A1?from=s1',
      ),
    );
  });

  it('shows five segments, then expands and collapses the rest', () => {
    vi.mocked(useSessionSegments).mockReturnValue(
      Array.from({ length: 7 }, (_, i) => ({
        segment: createMockMatchedSegment({ id: `seg-${i}`, name: `Stretch ${i}`, passes: [pass] }),
        pass,
        rank: 2,
      })),
    );
    const view = renderRow();

    expect(view.getAllByTestId('segment-item')).toHaveLength(5);
    fireEvent.click(view.getByRole('button', { name: 'Show 2 more segments' }));
    expect(view.getAllByTestId('segment-item')).toHaveLength(7);
    fireEvent.click(view.getByRole('button', { name: 'Show fewer segments' }));
    expect(view.getAllByTestId('segment-item')).toHaveLength(5);
  });

  it('shows the how-to as the second line with segments', () => {
    const view = renderRow();

    expect(view.getByTestId('segments-row')).toHaveTextContent('1 segment');
    expect(view.getByTestId('segments-row')).toHaveTextContent(
      'Select a stretch on the charts or use the menu',
    );
  });

  it('shows the how-to below "No segments yet" without segments', () => {
    vi.mocked(useSessionSegments).mockReturnValue([]);
    const view = renderRow();

    expect(view.getByTestId('segments-row')).toHaveTextContent('No segments yet');
    expect(view.getByTestId('segments-row')).toHaveTextContent(
      'Select a stretch on the charts or use the menu',
    );
  });

  it('frames the segments with plain Start and End labels', () => {
    const view = renderRow();

    expect(view.getByTestId('segment-ride-rail-start')).toHaveTextContent(/^Start$/);
    expect(view.getByTestId('segment-ride-rail-end')).toHaveTextContent(/^End$/);
  });

  it('shows no start and end rail without segments', () => {
    vi.mocked(useSessionSegments).mockReturnValue([]);
    const view = renderRow();

    expect(view.queryByTestId('segment-ride-rail')).not.toBeInTheDocument();
  });
});
