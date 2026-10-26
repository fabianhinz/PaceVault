import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { act } from '@testing-library/react';
import { useMapHover } from '@/features/map/hooks/useMapHover.ts';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { createMatchMedia, DESKTOP_MIN_WIDTH } from '@testUtils/matchMedia.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';

describe(useMapHover.name, () => {
  beforeEach(() => {
    useMapFocusStore.setState({ hoveredSessionId: null, hoveredStudioRouteId: null });
  });

  it('sets and clears hoveredSessionId via pointer handlers with a fine pointer', () => {
    window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: true });
    const hook = renderHookWithProviders(() => useMapHover({ kind: 'session', id: 'session-abc' }));

    act(() => {
      hook.result.current.onPointerEnter();
    });
    expect(useMapFocusStore.getState().hoveredSessionId).toBe('session-abc');

    act(() => {
      hook.result.current.onPointerLeave();
    });
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
  });

  it('targets hoveredStudioRouteId for the studioRoute kind', () => {
    window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: true });
    const hook = renderHookWithProviders(() =>
      useMapHover({ kind: 'studioRoute', id: 'route-abc' }),
    );

    act(() => {
      hook.result.current.onPointerEnter();
    });
    expect(useMapFocusStore.getState().hoveredStudioRouteId).toBe('route-abc');
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();

    act(() => {
      hook.result.current.onPointerLeave();
    });
    expect(useMapFocusStore.getState().hoveredStudioRouteId).toBeNull();
  });

  it('does not touch the store on touch (no fine pointer)', () => {
    window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: false });
    const hook = renderHookWithProviders(() => useMapHover({ kind: 'session', id: 'session-abc' }));

    act(() => {
      hook.result.current.onPointerEnter();
    });
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();

    useMapFocusStore.getState().setHoveredSession('session-other');
    act(() => {
      hook.result.current.onPointerLeave();
    });
    expect(useMapFocusStore.getState().hoveredSessionId).toBe('session-other');
  });

  it('clears the hovered id on unmount (pointerLeave may not fire)', () => {
    window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: true });
    useMapFocusStore.getState().setHoveredSession('session-abc');
    expect(useMapFocusStore.getState().hoveredSessionId).toBe('session-abc');

    const hook = renderHookWithProviders(() => useMapHover({ kind: 'session', id: 'session-abc' }));
    hook.unmount();

    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
  });
});
