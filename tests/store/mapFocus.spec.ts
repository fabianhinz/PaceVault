import { describe, it, expect, beforeEach } from 'vitest';
import { useMapFocusStore } from '@/store/mapFocus.ts';

describe('useMapFocusStore', () => {
  beforeEach(() => {
    useMapFocusStore.setState({
      openedSessionId: null,
      hoveredSessionId: null,
      focusedSport: null,
      hoveredPoint: null,
      pickCircle: null,
      lapMarkers: [],
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

  it('defaults focusedSport to null', () => {
    expect(useMapFocusStore.getState().focusedSport).toBeNull();
  });

  it('setOpenedSession(null) also clears the focused sport', () => {
    useMapFocusStore.getState().setOpenedSession('abc-123');
    useMapFocusStore.getState().setFocusedSport('running');
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapFocusStore.getState().focusedSport).toBeNull();
  });

  it('setOpenedSession(id) keeps the focused sport', () => {
    useMapFocusStore.getState().setFocusedSport('cycling');
    useMapFocusStore.getState().setOpenedSession('new-id');
    expect(useMapFocusStore.getState().focusedSport).toBe('cycling');
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

  it('defaults lapMarkers to empty array', () => {
    expect(useMapFocusStore.getState().lapMarkers).toEqual([]);
  });

  it('setLapMarkers stores markers', () => {
    const markers = [
      { lapIndex: 0, position: [11.0, 48.0] as [number, number], label: '1' },
      { lapIndex: 1, position: [11.1, 48.1] as [number, number], label: '2' },
    ];
    useMapFocusStore.getState().setLapMarkers(markers);
    expect(useMapFocusStore.getState().lapMarkers).toEqual(markers);
  });

  it('clearLapMarkers resets to empty array', () => {
    useMapFocusStore
      .getState()
      .setLapMarkers([{ lapIndex: 0, position: [11.0, 48.0] as [number, number], label: '1' }]);
    useMapFocusStore.getState().clearLapMarkers();
    expect(useMapFocusStore.getState().lapMarkers).toEqual([]);
  });

  it('setOpenedSession(null) also clears lapMarkers', () => {
    useMapFocusStore.getState().setOpenedSession('abc-123');
    useMapFocusStore
      .getState()
      .setLapMarkers([{ lapIndex: 0, position: [11.0, 48.0] as [number, number], label: '1' }]);
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapFocusStore.getState().lapMarkers).toEqual([]);
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
