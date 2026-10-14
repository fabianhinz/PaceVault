import { describe, it, expect, beforeEach } from 'vitest';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import { useMapControlsStore } from '@/store/mapControls.ts';

describe('useMapFocusStore', () => {
  beforeEach(() => {
    useMapFocusStore.setState({
      openedSessionId: null,
      hoveredSessionId: null,
      hoveredPoint: null,
      pickCircle: null,
    });
    useMapControlsStore.setState({
      trackColorMode: 'sport',
      sessionColorMode: 'sport',
      lapSource: 'splits',
      splitDistance: null,
      selectedLapIndex: null,
      hoveredLapIndex: null,
    });
  });

  it('defaults openedSessionId to null', () => {
    expect(useMapFocusStore.getState().openedSessionId).toBeNull();
  });

  it('setOpenedSession sets the id', () => {
    useMapFocusStore.getState().setOpenedSession('abc-123');
    expect(useMapFocusStore.getState().openedSessionId).toBe('abc-123');
  });

  it('setOpenedSession(null) clears the id', () => {
    useMapFocusStore.getState().setOpenedSession('abc-123');
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapFocusStore.getState().openedSessionId).toBeNull();
  });

  it('defaults hoveredSessionId to null', () => {
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
  });

  it('setHoveredSession sets the id', () => {
    useMapFocusStore.getState().setHoveredSession('xyz-456');
    expect(useMapFocusStore.getState().hoveredSessionId).toBe('xyz-456');
  });

  it('setHoveredSession(null) clears the id', () => {
    useMapFocusStore.getState().setHoveredSession('xyz-456');
    useMapFocusStore.getState().setHoveredSession(null);
    expect(useMapFocusStore.getState().hoveredSessionId).toBeNull();
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

  it('setOpenedSession(null) resets trackColorMode to sport', () => {
    useMapFocusStore.getState().setOpenedSession('abc-123');
    useMapControlsStore.getState().setTrackColorMode('wind');
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapControlsStore.getState().trackColorMode).toBe('sport');
  });

  it('color by starts at sport and is not carried over to the next session', () => {
    expect(useMapControlsStore.getState().sessionColorMode).toBe('sport');
    useMapFocusStore.getState().setOpenedSession('first');
    useMapControlsStore.getState().setSessionColorMode('hr');
    useMapFocusStore.getState().setOpenedSession('first');
    expect(useMapControlsStore.getState().sessionColorMode).toBe('hr');
    useMapFocusStore.getState().setOpenedSession('second');
    expect(useMapControlsStore.getState().sessionColorMode).toBe('sport');
    useMapControlsStore.getState().setSessionColorMode('power');
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapControlsStore.getState().sessionColorMode).toBe('sport');
  });

  it('laps start on the sport default splits and neither source, distance nor selection carries over to the next session', () => {
    expect(useMapControlsStore.getState().lapSource).toBe('splits');
    expect(useMapControlsStore.getState().splitDistance).toBeNull();
    useMapFocusStore.getState().setOpenedSession('first');
    useMapControlsStore.getState().setSplitDistance(2500);
    useMapControlsStore.getState().selectLap(3);
    useMapFocusStore.getState().setOpenedSession('first');
    expect(useMapControlsStore.getState().splitDistance).toBe(2500);
    expect(useMapControlsStore.getState().selectedLapIndex).toBe(3);
    useMapFocusStore.getState().setOpenedSession('second');
    expect(useMapControlsStore.getState().lapSource).toBe('splits');
    expect(useMapControlsStore.getState().splitDistance).toBeNull();
    expect(useMapControlsStore.getState().selectedLapIndex).toBeNull();
    useMapControlsStore.getState().setLapSource('device');
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapControlsStore.getState().lapSource).toBe('splits');
  });

  it('defaults hoveredStudioRouteId to null', () => {
    expect(useMapFocusStore.getState().hoveredStudioRouteId).toBeNull();
  });

  it('setHoveredStudioRoute sets the id and null clears it', () => {
    useMapFocusStore.getState().setHoveredStudioRoute('r1');
    expect(useMapFocusStore.getState().hoveredStudioRouteId).toBe('r1');
    useMapFocusStore.getState().setHoveredStudioRoute(null);
    expect(useMapFocusStore.getState().hoveredStudioRouteId).toBeNull();
  });
});
