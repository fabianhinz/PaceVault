import { describe, expect, it } from 'vite-plus/test';
import { act } from '@testing-library/react';
import { useSegmentPassSelection } from '@/components/segments/hooks/useSegmentPassSelection.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';
import {
  createMockMatchedSegment,
  createMockStoredSegmentPass,
} from '@tests/factories/segments.ts';

const segment = createMockMatchedSegment({
  passes: [
    createMockStoredSegmentPass({ sessionId: 'best', date: 1, durationSec: 200 }),
    createMockStoredSegmentPass({ sessionId: 'middle', date: 2, durationSec: 250 }),
    createMockStoredSegmentPass({ sessionId: 'latest', date: 3, durationSec: 300 }),
  ],
});

const renderSelection = (initialPath = '/segments/segment-1') =>
  renderHookWithProviders(() => useSegmentPassSelection(segment), { initialPath });

describe(useSegmentPassSelection.name, () => {
  it('selects the latest pass on open', () => {
    expect(renderSelection().result.current[0]).toBe('latest');
  });

  it('selects the pass of the session the page was opened from', () => {
    expect(renderSelection('/segments/segment-1?from=middle').result.current[0]).toBe('middle');
  });

  it('moves the selection to a clicked pass and keeps it on a second click', () => {
    const hook = renderSelection();

    act(() => hook.result.current[1]('middle'));
    expect(hook.result.current[0]).toBe('middle');

    act(() => hook.result.current[1]('middle'));
    expect(hook.result.current[0]).toBe('middle');
  });

  it('selects the best pass on its click', () => {
    const hook = renderSelection();

    act(() => hook.result.current[1]('best'));

    expect(hook.result.current[0]).toBe('best');
  });

  it('falls back to the default when the picked pass leaves the view', () => {
    const hook = renderSelection();

    act(() => hook.result.current[1]('unknown'));

    expect(hook.result.current[0]).toBe('latest');
  });
});
