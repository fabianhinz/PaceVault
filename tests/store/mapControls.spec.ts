import { describe, it, expect, beforeEach } from 'vite-plus/test';
import { useMapControlsStore } from '@/store/mapControls.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';

describe('useMapControlsStore', () => {
  beforeEach(() => {
    useMapControlsStore.setState({
      trackColorMode: 'sport',
      selectedLapIndex: null,
      hoveredLapIndex: null,
    });
  });

  it('defaults trackColorMode to sport', () => {
    expect(useMapControlsStore.getState().trackColorMode).toBe('sport');
  });

  it('changing the lap source or split distance clears the selected and hovered lap', () => {
    useMapControlsStore.getState().selectLap(2);
    useMapControlsStore.getState().setHoveredLap(1);
    useMapPreferencesStore.getState().setSessionLapSource('running', 'device');
    expect(useMapControlsStore.getState().selectedLapIndex).toBeNull();
    expect(useMapControlsStore.getState().hoveredLapIndex).toBeNull();
    useMapControlsStore.getState().selectLap(2);
    useMapPreferencesStore.getState().setSessionSplitDistance('running', 1500);
    expect(useMapControlsStore.getState().selectedLapIndex).toBeNull();
    expect(useMapPreferencesStore.getState().bySport.running.lapSource).toBe('splits');
  });

  it('tapping the selected lap again clears it', () => {
    useMapControlsStore.getState().toggleSelectedLap(1);
    expect(useMapControlsStore.getState().selectedLapIndex).toBe(1);
    useMapControlsStore.getState().toggleSelectedLap(1);
    expect(useMapControlsStore.getState().selectedLapIndex).toBeNull();
  });
});
