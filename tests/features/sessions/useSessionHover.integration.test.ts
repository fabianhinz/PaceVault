import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionHover } from '@/features/sessions/hooks/useSessionHover.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';

const stubMatchMedia = (matches: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
};

describe('useSessionHover', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    useMapFocusStore.setState({ hoveredSessionId: null });
  });

  it('sets and clears hoveredSessionId via pointer handlers on desktop', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useSessionHover('session-abc'));

    act(() => {
      result.current.onPointerEnter();
    });
    expect(useMapFocusStore.getState().hoveredSessionId).toBe('session-abc');

    act(() => {
      result.current.onPointerLeave();
    });
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
  });

  it('does not touch the store on non-desktop viewports', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useSessionHover('session-abc'));

    act(() => {
      result.current.onPointerEnter();
    });
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();

    useMapFocusStore.getState().setHoveredSession('session-other');
    act(() => {
      result.current.onPointerLeave();
    });
    expect(useMapFocusStore.getState().hoveredSessionId).toBe('session-other');
  });

  it('clears hoveredSessionId on unmount (pointerLeave may not fire)', () => {
    stubMatchMedia(true);
    useMapFocusStore.getState().setHoveredSession('session-abc');
    expect(useMapFocusStore.getState().hoveredSessionId).toBe('session-abc');

    const { unmount } = renderHook(() => useSessionHover('session-abc'));
    unmount();

    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
  });
});
