import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { INITIAL_MAP_FOCUS_STORE_STATE, useMapFocusStore } from '@/store/mapFocus.ts';

describe('useMapFocusStore', () => {
  beforeEach(() => {
    useMapFocusStore.setState(INITIAL_MAP_FOCUS_STORE_STATE);
  });

  it('defaults pickCircle to null', () => {
    expect(useMapFocusStore.getState().pickCircle).toBeNull();
  });

  it('setPickCircle stores the center', () => {
    useMapFocusStore.getState().setPickCircle([10.5, 48.2]);
    expect(useMapFocusStore.getState().pickCircle).toEqual([10.5, 48.2]);
  });

  it('clearPickCircle resets to null', () => {
    useMapFocusStore.getState().setPickCircle([10.5, 48.2]);
    useMapFocusStore.getState().clearPickCircle();
    expect(useMapFocusStore.getState().pickCircle).toBeNull();
  });

  it('clearMapHover clears only the hover of the same target', () => {
    const hover = { target: { kind: 'segment' as const, id: 'b' }, sceneKey: 'segmentTab /' };
    useMapFocusStore.getState().setMapHover(hover);

    useMapFocusStore.getState().clearMapHover({ kind: 'segment', id: 'a' });
    useMapFocusStore.getState().clearMapHover({ kind: 'session', id: 'b' });
    expect(useMapFocusStore.getState().mapHover).toEqual(hover);

    useMapFocusStore.getState().clearMapHover({ kind: 'segment', id: 'b' });
    expect(useMapFocusStore.getState().mapHover).toBeNull();
  });
});
