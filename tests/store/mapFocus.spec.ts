import { describe, it, expect, beforeEach } from 'vitest';
import { useMapFocusStore } from '@/store/mapFocus.ts';
import type { SessionLap } from '@/packages/engine/types.ts';

const makeLap = (overrides: Partial<SessionLap> = {}): SessionLap => ({
  sessionId: 's1',
  lapIndex: 0,
  startTime: 0,
  endTime: 300,
  totalElapsedTime: 300,
  totalTimerTime: 300,
  distance: 1000,
  avgSpeed: 3.33,
  ...overrides,
});

describe('useMapFocusStore', () => {
  beforeEach(() => {
    useMapFocusStore.setState({
      openedSessionId: null,
      hoveredSessionId: null,
      focusedLaps: [],
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

  it('defaults focusedLaps to empty array', () => {
    expect(useMapFocusStore.getState().focusedLaps).toEqual([]);
  });

  it('defaults focusedSport to null', () => {
    expect(useMapFocusStore.getState().focusedSport).toBeNull();
  });

  it('setFocusedLaps stores laps and sport', () => {
    const laps = [makeLap({ lapIndex: 0 }), makeLap({ lapIndex: 1 })];
    useMapFocusStore.getState().setFocusedLaps(laps, 'running', []);
    expect(useMapFocusStore.getState().focusedLaps).toEqual(laps);
    expect(useMapFocusStore.getState().focusedSport).toBe('running');
  });

  it('clearFocusedLaps resets laps and sport', () => {
    useMapFocusStore.getState().setFocusedLaps([makeLap()], 'cycling', []);
    useMapFocusStore.getState().clearFocusedLaps();
    expect(useMapFocusStore.getState().focusedLaps).toEqual([]);
    expect(useMapFocusStore.getState().focusedSport).toBeNull();
  });

  it('setOpenedSession(null) also clears laps and sport', () => {
    useMapFocusStore.getState().setOpenedSession('abc-123');
    useMapFocusStore.getState().setFocusedLaps([makeLap()], 'running', []);
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapFocusStore.getState().openedSessionId).toBeNull();
    expect(useMapFocusStore.getState().focusedLaps).toEqual([]);
    expect(useMapFocusStore.getState().focusedSport).toBeNull();
  });

  it('setOpenedSession(id) preserves existing laps', () => {
    const laps = [makeLap()];
    useMapFocusStore.getState().setFocusedLaps(laps, 'cycling', []);
    useMapFocusStore.getState().setOpenedSession('new-id');
    expect(useMapFocusStore.getState().focusedLaps).toEqual(laps);
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

  it('defaults zoneColorMode to null', () => {
    expect(useMapFocusStore.getState().zoneColorMode).toBeNull();
  });

  it('setZoneColorMode sets the mode', () => {
    useMapFocusStore.getState().setZoneColorMode('hr');
    expect(useMapFocusStore.getState().zoneColorMode).toBe('hr');
  });

  it('setZoneColorMode(null) clears the mode', () => {
    useMapFocusStore.getState().setZoneColorMode('power');
    useMapFocusStore.getState().setZoneColorMode(null);
    expect(useMapFocusStore.getState().zoneColorMode).toBeNull();
  });

  it('setOpenedSession(null) resets zoneColorMode', () => {
    useMapFocusStore.getState().setOpenedSession('abc-123');
    useMapFocusStore.getState().setZoneColorMode('pace');
    useMapFocusStore.getState().setOpenedSession(null);
    expect(useMapFocusStore.getState().zoneColorMode).toBeNull();
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
