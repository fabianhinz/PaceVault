import { describe, it, expect, beforeEach } from 'vitest';
import { useMapFocusStore } from '@/store/mapFocus.ts';

describe('useMapFocusStore', () => {
  beforeEach(() => {
    useMapFocusStore.setState({
      openedSessionId: null,
      hoveredSessionId: null,
      hoveredPoint: null,
      pickCircle: null,
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

  it('defaults trackColorMode to sport', () => {
    expect(useMapFocusStore.getState().trackColorMode).toBe('sport');
  });

  it('setOpenedSession(null) resets trackColorMode to sport', () => {
    useMapFocusStore.getState().setOpenedSession('abc-123');
    useMapFocusStore.getState().setTrackColorMode('wind');
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapFocusStore.getState().trackColorMode).toBe('sport');
  });

  it('color by starts at sport and is not carried over to the next session', () => {
    expect(useMapFocusStore.getState().sessionColorMode).toBe('sport');
    useMapFocusStore.getState().setOpenedSession('first');
    useMapFocusStore.getState().setSessionColorMode('hr');
    useMapFocusStore.getState().setOpenedSession('first');
    expect(useMapFocusStore.getState().sessionColorMode).toBe('hr');
    useMapFocusStore.getState().setOpenedSession('second');
    expect(useMapFocusStore.getState().sessionColorMode).toBe('sport');
    useMapFocusStore.getState().setSessionColorMode('power');
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapFocusStore.getState().sessionColorMode).toBe('sport');
  });

  it('laps start on the sport default splits and neither source, distance nor selection carries over to the next session', () => {
    expect(useMapFocusStore.getState().lapSource).toBe('splits');
    expect(useMapFocusStore.getState().splitDistance).toBeNull();
    useMapFocusStore.getState().setOpenedSession('first');
    useMapFocusStore.getState().setSplitDistance(2500);
    useMapFocusStore.getState().selectLap(3);
    useMapFocusStore.getState().setOpenedSession('first');
    expect(useMapFocusStore.getState().splitDistance).toBe(2500);
    expect(useMapFocusStore.getState().selectedLapIndex).toBe(3);
    useMapFocusStore.getState().setOpenedSession('second');
    expect(useMapFocusStore.getState().lapSource).toBe('splits');
    expect(useMapFocusStore.getState().splitDistance).toBeNull();
    expect(useMapFocusStore.getState().selectedLapIndex).toBeNull();
    useMapFocusStore.getState().setLapSource('device');
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapFocusStore.getState().lapSource).toBe('splits');
  });

  it('changing the lap source or split distance clears the selected lap', () => {
    useMapFocusStore.getState().selectLap(2);
    useMapFocusStore.getState().setLapSource('device');
    expect(useMapFocusStore.getState().selectedLapIndex).toBeNull();
    useMapFocusStore.getState().selectLap(2);
    useMapFocusStore.getState().setSplitDistance(1500);
    expect(useMapFocusStore.getState().selectedLapIndex).toBeNull();
    expect(useMapFocusStore.getState().lapSource).toBe('splits');
  });

  it('tapping the selected lap again clears it', () => {
    useMapFocusStore.getState().toggleSelectedLap(1);
    expect(useMapFocusStore.getState().selectedLapIndex).toBe(1);
    useMapFocusStore.getState().toggleSelectedLap(1);
    expect(useMapFocusStore.getState().selectedLapIndex).toBeNull();
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
