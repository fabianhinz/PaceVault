import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMapHover } from '@/lib/hooks/useMapHover.ts';
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

describe('useMapHover', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    useMapFocusStore.setState({ hoveredSessionId: null, hoveredStudioRouteId: null });
  });

  it('sets and clears hoveredSessionId via pointer handlers on desktop', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useMapHover('session', 'session-abc'));

    act(() => {
      result.current.onPointerEnter();
    });
    expect(useMapFocusStore.getState().hoveredSessionId).toBe('session-abc');

    act(() => {
      result.current.onPointerLeave();
    });
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
  });

  it('targets hoveredStudioRouteId for the studioRoute kind', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useMapHover('studioRoute', 'route-abc'));

    act(() => {
      result.current.onPointerEnter();
    });
    expect(useMapFocusStore.getState().hoveredStudioRouteId).toBe('route-abc');
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();

    act(() => {
      result.current.onPointerLeave();
    });
    expect(useMapFocusStore.getState().hoveredStudioRouteId).toBeNull();
  });

  it('does not touch the store on non-desktop viewports', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useMapHover('session', 'session-abc'));

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

  it('clears the hovered id on unmount (pointerLeave may not fire)', () => {
    stubMatchMedia(true);
    useMapFocusStore.getState().setHoveredSession('session-abc');
    expect(useMapFocusStore.getState().hoveredSessionId).toBe('session-abc');

    const { unmount } = renderHook(() => useMapHover('session', 'session-abc'));
    unmount();

    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
  });
});
