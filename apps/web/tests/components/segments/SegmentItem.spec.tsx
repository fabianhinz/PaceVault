import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { fireEvent, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { SegmentItem } from '@/components/segments/SegmentItem.tsx';
import { Segments } from '@/components/segments/index.tsx';
import { useSegmentDetail } from '@/components/segments/hooks/useSegmentDetail.ts';
import { renderWithProviders } from '@testUtils/render.ts';
import { createMatchMedia } from '@testUtils/matchMedia.ts';
import { createMockMatchedSegment } from '@tests/factories/segments.ts';

vi.mock('@/components/segments/hooks/useSegmentDetail.ts', () => ({ useSegmentDetail: vi.fn() }));
vi.mock('@/components/segments/SegmentDetail.tsx', () => ({ SegmentDetail: () => null }));

const segment = createMockMatchedSegment({
  name: 'Isar',
  netElevationMeters: 12,
  lastPassDate: Date.UTC(2026, 0, 15, 12),
});
const HEADER_TEXT = 'IsarJan 15, 2026 · 1.0 km · +12 m · 2 passes';

const LocationProbe = () => {
  const location = useLocation();
  return <output aria-label="location">{location.pathname}</output>;
};

describe(SegmentItem.name, () => {
  beforeEach(() => {
    window.matchMedia = createMatchMedia(1440);
    vi.mocked(useSegmentDetail).mockReturnValue({ segment, matched: segment, matching: false });
  });

  it('shows the segment header with a subtitle1 title', () => {
    const item = renderWithProviders(<SegmentItem segment={segment} />);

    expect(item.getByTestId('segment-header')).toHaveTextContent(HEADER_TEXT);
  });

  it('shows the same header on the segment page it opens, as the page heading', () => {
    const page = renderWithProviders(<Segments />, { initialPath: '/segments/segment-1' });

    expect(page.getByTestId('segment-header')).toHaveTextContent(HEADER_TEXT);
    expect(page.getByRole('heading', { level: 1 })).toHaveTextContent('Isar');
  });

  it('opens the segment on Enter', async () => {
    const view = renderWithProviders(
      <>
        <SegmentItem segment={segment} />
        <LocationProbe />
      </>,
    );

    fireEvent.keyDown(view.getByRole('button', { name: 'Isar' }), { key: 'Enter' });

    await waitFor(() =>
      expect(view.getByRole('status', { name: 'location' })).toHaveTextContent(
        `/segments/${segment.id}`,
      ),
    );
  });
});
