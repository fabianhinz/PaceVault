import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { fireEvent, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { SegmentNameDialog } from '@/components/segments/SegmentNameDialog.tsx';
import type { Segment } from '@/store/segments.ts';
import { renderWithProviders } from '@testUtils/render.ts';
import { createMatchMedia } from '@testUtils/matchMedia.ts';
import { createMockSegment } from '@tests/factories/segments.ts';

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

const LocationProbe = () => {
  const location = useLocation();
  return <output aria-label="location">{location.pathname}</output>;
};

const renderDialog = (options: {
  mode?: 'create' | 'rename';
  similarSegment?: Segment;
  onSubmit?: (name: string) => void;
  onOpenChange?: (open: boolean) => void;
}) =>
  renderWithProviders(
    <>
      <SegmentNameDialog
        open
        onOpenChange={options.onOpenChange ?? vi.fn()}
        mode={options.mode ?? 'create'}
        title="Save as segment"
        initialName="Morning Run · km 2.1–3.5"
        facts="Running · 1.4 km · +4 m"
        similarSegment={options.similarSegment}
        onSubmit={options.onSubmit ?? vi.fn()}
      />
      <LocationProbe />
    </>,
  );

describe(SegmentNameDialog.name, () => {
  beforeEach(() => {
    window.matchMedia = createMatchMedia(1440);
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  it('prefills and selects the name', async () => {
    const view = renderDialog({});
    const input = view.getByLabelText('Name');

    expect(input).toHaveValue('Morning Run · km 2.1–3.5');
    await waitFor(() => expect(input).toHaveFocus());
    expect(input).toHaveProperty('selectionStart', 0);
    expect(input).toHaveProperty('selectionEnd', 'Morning Run · km 2.1–3.5'.length);
  });

  it('saves the trimmed name on Enter', () => {
    const onSubmit = vi.fn();
    const view = renderDialog({ onSubmit });

    fireEvent.change(view.getByLabelText('Name'), { target: { value: '  Hill sprint ' } });
    fireEvent.submit(view.getByLabelText('Name'));

    expect(onSubmit).toHaveBeenCalledWith('Hill sprint');
  });

  it('disables Save for a blank name', () => {
    const view = renderDialog({});

    fireEvent.change(view.getByLabelText('Name'), { target: { value: '   ' } });

    expect(view.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('names a similar segment, opens it and still saves', async () => {
    const onSubmit = vi.fn();
    const onOpenChange = vi.fn();
    const similar = createMockSegment({ id: 'hill', name: 'Hill' });
    const view = renderDialog({ similarSegment: similar, onSubmit, onOpenChange });

    expect(
      view.getByText('A segment with nearly the same start and end exists: Hill'),
    ).toBeInTheDocument();
    fireEvent.click(view.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith('Morning Run · km 2.1–3.5');

    fireEvent.click(view.getByRole('button', { name: 'Open segment' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() =>
      expect(view.getByRole('status', { name: 'location', hidden: true })).toHaveTextContent(
        '/segments/hill',
      ),
    );
  });

  it('shows no similar hint when renaming', () => {
    const view = renderDialog({
      mode: 'rename',
      similarSegment: createMockSegment({ name: 'Hill' }),
    });

    expect(view.queryByRole('button', { name: 'Open segment' })).not.toBeInTheDocument();
  });
});
