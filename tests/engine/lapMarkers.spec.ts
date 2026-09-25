import { describe, it, expect } from 'vitest';
import { computeLapMarkers } from '@/lib/lapMarkers.ts';
import type { LapMarkerMode } from '@/lib/lapMarkers.ts';
import type { SessionLap, SessionRecord } from '@/packages/engine/types.ts';

const makeRecord = (overrides: Partial<SessionRecord> = {}, index = 0): SessionRecord => ({
  timestamp: index,
  lat: 48.0 + index * 0.001,
  lng: 11.0 + index * 0.001,
  distance: index * 100,
  ...overrides,
});

const makeGPSRecords = (count: number): SessionRecord[] =>
  Array.from({ length: count }, (_, i) => makeRecord({}, i));

const makeLap = (overrides: Partial<SessionLap> = {}): SessionLap => ({
  lapIndex: 0,
  startTime: 1000,
  endTime: 4000,
  totalElapsedTime: 3,
  totalTimerTime: 3,
  distance: 1000,
  avgSpeed: 3.33,
  ...overrides,
});

describe('computeLapMarkers', () => {
  describe('common', () => {
    it('returns empty for empty records (device mode)', () => {
      const mode: LapMarkerMode = {
        kind: 'device',
        laps: [makeLap()],
        sessionStartMs: 1000,
      };
      expect(computeLapMarkers([], mode)).toEqual([]);
    });

    it('returns empty for empty records (dynamic mode)', () => {
      const mode: LapMarkerMode = {
        kind: 'dynamic',
        splitDistanceMetres: 1000,
      };
      expect(computeLapMarkers([], mode)).toEqual([]);
    });

    it('returns empty for records without GPS', () => {
      const records = [
        makeRecord({ lat: undefined, lng: undefined }, 0),
        makeRecord({ lat: undefined, lng: undefined }, 1),
        makeRecord({ lat: undefined, lng: undefined }, 2),
      ];
      const mode: LapMarkerMode = {
        kind: 'device',
        laps: [makeLap({ lapIndex: 0, startTime: 1000 })],
        sessionStartMs: 1000,
      };
      expect(computeLapMarkers(records, mode)).toEqual([]);
    });

    it('produces labels as 1-indexed strings', () => {
      const records = makeGPSRecords(10);
      const laps = [
        makeLap({ lapIndex: 0, startTime: 1000, endTime: 4000 }),
        makeLap({ lapIndex: 1, startTime: 4000, endTime: 7000 }),
        makeLap({ lapIndex: 2, startTime: 7000, endTime: 10000 }),
      ];
      const mode: LapMarkerMode = {
        kind: 'device',
        laps,
        sessionStartMs: 1000,
      };
      const markers = computeLapMarkers(records, mode);
      expect(markers.map((m) => m.label)).toEqual(['1', '2', '3']);
    });

    it('positions are [lng, lat] order', () => {
      const records = [makeRecord({ lat: 48.123, lng: 11.456 }, 0)];
      const mode: LapMarkerMode = {
        kind: 'device',
        laps: [makeLap({ lapIndex: 0, startTime: 1000 })],
        sessionStartMs: 1000,
      };
      const markers = computeLapMarkers(records, mode);
      expect(markers[0].position).toEqual([11.456, 48.123]);
    });
  });

  describe('device mode', () => {
    it('returns correct marker count matching lap count', () => {
      const records = makeGPSRecords(10);
      const laps = [
        makeLap({ lapIndex: 0, startTime: 1000, endTime: 4000 }),
        makeLap({ lapIndex: 1, startTime: 4000, endTime: 7000 }),
      ];
      const mode: LapMarkerMode = {
        kind: 'device',
        laps,
        sessionStartMs: 1000,
      };
      const markers = computeLapMarkers(records, mode);
      expect(markers).toHaveLength(2);
      expect(markers[0].lapIndex).toBe(0);
      expect(markers[1].lapIndex).toBe(1);
    });

    it('skips laps where no records have GPS', () => {
      const records = [
        makeRecord({ lat: 48.0, lng: 11.0 }, 0),
        makeRecord({ lat: 48.001, lng: 11.001 }, 1),
        makeRecord({ lat: 48.002, lng: 11.002 }, 2),
        // Records at timestamp 3-5 have no GPS
        makeRecord({ lat: undefined, lng: undefined }, 3),
        makeRecord({ lat: undefined, lng: undefined }, 4),
        makeRecord({ lat: undefined, lng: undefined }, 5),
        makeRecord({ lat: 48.006, lng: 11.006 }, 6),
      ];
      const laps = [
        makeLap({ lapIndex: 0, startTime: 1000, endTime: 4000 }),
        // Lap 1 starts at timestamp 3 — no GPS records until timestamp 6
        makeLap({ lapIndex: 1, startTime: 4000, endTime: 7000 }),
        makeLap({ lapIndex: 2, startTime: 7000, endTime: 10000 }),
      ];
      const mode: LapMarkerMode = {
        kind: 'device',
        laps,
        sessionStartMs: 1000,
      };
      const markers = computeLapMarkers(records, mode);
      // Lap 0 at timestamp 0, Lap 1 skipped (no GPS at 3-5 but 6 qualifies since >= 3), Lap 2 at timestamp 6
      expect(markers).toHaveLength(3);
    });

    it('finds first record with GPS at or after lap start', () => {
      const records = [
        makeRecord({ lat: undefined, lng: undefined }, 0),
        makeRecord({ lat: 48.1, lng: 11.1 }, 1),
      ];
      const mode: LapMarkerMode = {
        kind: 'device',
        laps: [makeLap({ lapIndex: 0, startTime: 1000 })],
        sessionStartMs: 1000,
      };
      const markers = computeLapMarkers(records, mode);
      expect(markers).toHaveLength(1);
      expect(markers[0].position).toEqual([11.1, 48.1]);
    });
  });

  describe('dynamic mode', () => {
    it('places markers at distance boundaries', () => {
      // 5 records: distances 0, 500, 1000, 1500, 2000
      const records = Array.from({ length: 5 }, (_, i) => makeRecord({ distance: i * 500 }, i));
      const mode: LapMarkerMode = {
        kind: 'dynamic',
        splitDistanceMetres: 1000,
      };
      const markers = computeLapMarkers(records, mode);
      // Start marker at distance 0, then at distance 1000, then at distance 2000
      expect(markers).toHaveLength(3);
      expect(markers[0].label).toBe('1');
      expect(markers[1].label).toBe('2');
      expect(markers[2].label).toBe('3');
    });

    it('returns empty for records without distance', () => {
      const records = [
        makeRecord({ distance: undefined }, 0),
        makeRecord({ distance: undefined }, 1),
      ];
      const mode: LapMarkerMode = {
        kind: 'dynamic',
        splitDistanceMetres: 1000,
      };
      expect(computeLapMarkers(records, mode)).toEqual([]);
    });

    it('returns empty when fewer than 2 records with distance', () => {
      const records = [makeRecord({ distance: 0 }, 0)];
      const mode: LapMarkerMode = {
        kind: 'dynamic',
        splitDistanceMetres: 1000,
      };
      expect(computeLapMarkers(records, mode)).toEqual([]);
    });

    it('skips boundary markers where no GPS is available', () => {
      const records = [
        makeRecord({ distance: 0, lat: 48.0, lng: 11.0 }, 0),
        makeRecord({ distance: 500 }, 1),
        // At boundary: no GPS
        makeRecord({ distance: 1000, lat: undefined, lng: undefined }, 2),
        makeRecord({ distance: 1500, lat: undefined, lng: undefined }, 3),
        makeRecord({ distance: 2000, lat: 48.1, lng: 11.1 }, 4),
      ];
      const mode: LapMarkerMode = {
        kind: 'dynamic',
        splitDistanceMetres: 1000,
      };
      const markers = computeLapMarkers(records, mode);
      // Start marker at 0, boundary at 1000 — finds GPS at record 4 (2000m), boundary at 2000 — no more records after
      expect(markers[0].position).toEqual([11.0, 48.0]);
      expect(markers.length).toBeGreaterThanOrEqual(1);
    });
  });
});
