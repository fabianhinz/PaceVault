import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { act } from '@testing-library/react';
import { useMapHover } from '@/components/mapBackground/hooks/useMapHover.ts';
import { INITIAL_MAP_FOCUS_STORE_STATE, useMapFocusStore } from '@/store/mapFocus.ts';
import { createMatchMedia, DESKTOP_MIN_WIDTH } from '@testUtils/matchMedia.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';

describe(useMapHover.name, () => {
  beforeEach(() => {
    useMapFocusStore.setState(INITIAL_MAP_FOCUS_STORE_STATE);
  });

  it('sets the hover with the scene it was set in and clears it on pointer leave', () => {
    window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: true });
    const hook = renderHookWithProviders(() => useMapHover({ kind: 'segment', id: 'seg-1' }), {
      initialPath: '/?tab=segments',
    });

    act(() => {
      hook.result.current.onPointerEnter();
    });
    expect(useMapFocusStore.getState().mapHover).toEqual({
      target: { kind: 'segment', id: 'seg-1' },
      sceneKey: 'segmentTab /',
    });

    act(() => {
      hook.result.current.onPointerLeave();
    });
    expect(useMapFocusStore.getState().mapHover).toBeNull();
  });

  it('does not touch the store on touch (no fine pointer)', () => {
    window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: false });
    const hook = renderHookWithProviders(() => useMapHover({ kind: 'session', id: 'session-abc' }));

    act(() => {
      hook.result.current.onPointerEnter();
    });
    expect(useMapFocusStore.getState().mapHover).toBeNull();

    const other = {
      target: { kind: 'session' as const, id: 'session-abc' },
      sceneKey: 'overview /',
    };
    useMapFocusStore.getState().setMapHover(other);
    act(() => {
      hook.result.current.onPointerLeave();
    });
    expect(useMapFocusStore.getState().mapHover).toEqual(other);
  });

  it('clears the hover when its card unmounts (pointerLeave may not fire)', () => {
    window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: true });
    const hook = renderHookWithProviders(() => useMapHover({ kind: 'segment', id: 'seg-1' }), {
      initialPath: '/?tab=segments',
    });
    act(() => {
      hook.result.current.onPointerEnter();
    });

    hook.unmount();

    expect(useMapFocusStore.getState().mapHover).toBeNull();
  });

  it('an unmounting card leaves the hover of another card in place', () => {
    window.matchMedia = createMatchMedia(DESKTOP_MIN_WIDTH, { pointerFine: true });
    const hook = renderHookWithProviders(() => useMapHover({ kind: 'segment', id: 'seg-1' }));
    const other = { target: { kind: 'segment' as const, id: 'seg-2' }, sceneKey: 'segmentTab /' };
    useMapFocusStore.getState().setMapHover(other);

    hook.unmount();

    expect(useMapFocusStore.getState().mapHover).toEqual(other);
  });
});
