import { describe, it, expect, beforeEach } from 'vitest';
import { useMapControlsStore } from '@/store/mapControls.ts';

describe('useMapControlsStore', () => {
  beforeEach(() => {
    useMapControlsStore.setState({
      trackColorMode: 'sport',
      sessionColorMode: 'sport',
      lapSource: 'splits',
      splitDistance: null,
      selectedLapIndex: null,
      hoveredLapIndex: null,
    });
  });

  it('defaults trackColorMode to sport', () => {
    expect(useMapControlsStore.getState().trackColorMode).toBe('sport');
  });

  it('changing the lap source or split distance clears the selected lap', () => {
    useMapControlsStore.getState().selectLap(2);
    useMapControlsStore.getState().setLapSource('device');
    expect(useMapControlsStore.getState().selectedLapIndex).toBeNull();
    useMapControlsStore.getState().selectLap(2);
    useMapControlsStore.getState().setSplitDistance(1500);
    expect(useMapControlsStore.getState().selectedLapIndex).toBeNull();
    expect(useMapControlsStore.getState().lapSource).toBe('splits');
  });

  it('tapping the selected lap again clears it', () => {
    useMapControlsStore.getState().toggleSelectedLap(1);
    expect(useMapControlsStore.getState().selectedLapIndex).toBe(1);
    useMapControlsStore.getState().toggleSelectedLap(1);
    expect(useMapControlsStore.getState().selectedLapIndex).toBeNull();
  });
});
