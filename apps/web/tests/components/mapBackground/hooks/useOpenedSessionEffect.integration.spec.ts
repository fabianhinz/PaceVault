import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { useOpenedSessionEffect } from '@/components/mapBackground/hooks/useOpenedSessionEffect.ts';
import { INITIAL_MAP_FOCUS_STORE_STATE, useMapFocusStore } from '@/store/mapFocus.ts';
import { INITIAL_MAP_CONTROLS_STORE_STATE, useMapControlsStore } from '@/store/mapControls.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import { renderHookWithProviders } from '@testUtils/render.ts';

const renderOpenedSession = (sessionId: string | null) =>
  renderHookWithProviders((id: string | null) => useOpenedSessionEffect(id), {
    initialProps: sessionId,
  });

describe(useOpenedSessionEffect.name, () => {
  beforeEach(() => {
    useMapFocusStore.setState(INITIAL_MAP_FOCUS_STORE_STATE);
    useMapControlsStore.setState(INITIAL_MAP_CONTROLS_STORE_STATE);
  });

  it('closing the session resets trackColorMode to sport and clears the hovered point', () => {
    const hook = renderOpenedSession('abc-123');
    useMapControlsStore.getState().setTrackColorMode('wind');
    useMapFocusStore.getState().setHoveredPoint([11, 48]);

    hook.rerender(null);

    expect(useMapControlsStore.getState().trackColorMode).toBe('sport');
    expect(useMapFocusStore.getState().hoveredPoint).toBeNull();
  });

  it('opening another session keeps color by and laps preferences but clears the lap selection', () => {
    const hook = renderOpenedSession('first');
    useMapPreferencesStore.getState().setSessionColorMode({ sport: 'running', mode: 'hr' });
    useMapPreferencesStore.getState().setSessionSplitDistance({ sport: 'running', metres: 2500 });
    useMapControlsStore.getState().selectLap(3);

    hook.rerender('first');
    expect(useMapControlsStore.getState().selectedLapIndex).toBe(3);

    hook.rerender('second');
    expect(useMapControlsStore.getState().selectedLapIndex).toBeNull();

    hook.rerender(null);
    expect(useMapPreferencesStore.getState().bySport.running).toEqual({
      colorMode: 'hr',
      lapSource: 'splits',
      splitDistance: 2500,
    });
  });
});
