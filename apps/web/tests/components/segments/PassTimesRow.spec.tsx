import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { fireEvent } from '@testing-library/react';
import { PassTimesRow } from '@/components/segments/PassTimesRow.tsx';
import { useSessionsStore } from '@/store/sessions.ts';
import { renderWithProviders } from '@testUtils/render.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockSegment, createMockStoredSegmentPass } from '@tests/factories/segments.ts';

class ResizeObserverStub {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

const passes = [
  createMockStoredSegmentPass({ sessionId: 'a', date: 1, durationSec: 300 }),
  createMockStoredSegmentPass({ sessionId: 'b', date: 2, durationSec: 280 }),
  createMockStoredSegmentPass({ sessionId: 'c', date: 3, durationSec: 320 }),
  createMockStoredSegmentPass({ sessionId: 'd', date: 4, durationSec: 310 }),
];
const segment = createMockSegment({ passes });
const best = passes[1] ?? createMockStoredSegmentPass();

const renderRow = ({
  initialPath,
  onSelect,
}: {
  initialPath: string;
  onSelect: (id: string) => void;
}) =>
  renderWithProviders(
    <PassTimesRow
      segment={segment}
      best={best}
      selectedSessionId="d"
      sportColor="green"
      onSelect={onSelect}
    />,
    { initialPath },
  );

describe(PassTimesRow.name, () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    useSessionsStore.setState({
      sessions: ['a', 'b', 'c', 'd'].map((id) =>
        createMockTrainingSession({ id, name: `Run ${id.toUpperCase()}` }),
      ),
    });
  });

  it('shows only the best pass until the list is expanded and collapses it again', () => {
    const view = renderRow({ initialPath: '/segments/x', onSelect: vi.fn() });

    expect(view.getByRole('button', { name: /^Run B/ })).toBeInTheDocument();
    expect(view.queryByRole('button', { name: /^Run C/ })).not.toBeInTheDocument();

    fireEvent.click(view.getByRole('button', { name: 'Show 3 more passes' }));
    expect(view.getByRole('button', { name: /^Run C/ })).toBeInTheDocument();

    fireEvent.click(view.getByRole('button', { name: 'Show fewer passes' }));
    expect(view.queryByRole('button', { name: /^Run C/ })).not.toBeInTheDocument();
  });

  it('keeps the origin pass beside the best in the collapsed list', () => {
    const view = renderRow({ initialPath: '/segments/x?from=c', onSelect: vi.fn() });

    expect(view.getByRole('button', { name: /^Run C/ })).toBeInTheDocument();
    expect(view.queryByRole('button', { name: /^Run A/ })).not.toBeInTheDocument();
  });

  it('selects a pass on click', () => {
    const onSelect = vi.fn();
    const view = renderRow({ initialPath: '/segments/x', onSelect });

    fireEvent.click(view.getByRole('button', { name: /^Run B/ }));

    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
