import { describe, it, expect } from 'vite-plus/test';
import { windExposureFromRecords, relativeWindAngles, windAngles } from '../src/windExposure.ts';
import type { WindSample } from '../src/windExposure.ts';
import type { SessionRecord } from '../src/types.ts';
import { indoorRecordSeries } from '../../testing/src/series.ts';
import { createMockSessionRecord } from '../../testing/src/records.ts';

const trackFromLngs = (lngs: number[], lat = 48): SessionRecord[] =>
  lngs.map((lng, i) => createMockSessionRecord({ timestamp: i, lat, lng }));

const eastTrack = (count: number): SessionRecord[] =>
  trackFromLngs(Array.from({ length: count }, (_, i) => 11 + i * 0.001));

const windFrom = (direction: number): WindSample[] => [{ timeMs: 0, directionDegrees: direction }];

describe('windExposure', () => {
  describe(windExposureFromRecords.name, () => {
    it('reports 100% headwind when the wind blows from straight ahead', () => {
      const result = windExposureFromRecords({
        records: eastTrack(60),
        wind: windFrom(90),
        sessionStartMs: 0,
      });
      expect(result).not.toBeNull();
      if (!result) return;
      expect(result.headwindPct).toBe(100);
      expect(result.crosswindPct).toBe(0);
      expect(result.tailwindPct).toBe(0);
    });

    it('reports 100% tailwind when the wind blows from directly behind', () => {
      const result = windExposureFromRecords({
        records: eastTrack(60),
        wind: windFrom(270),
        sessionStartMs: 0,
      });
      expect(result?.tailwindPct).toBe(100);
      expect(result?.headwindPct).toBe(0);
      expect(result?.crosswindPct).toBe(0);
    });

    it('reports 100% crosswind when the wind blows perpendicular to travel', () => {
      const result = windExposureFromRecords({
        records: eastTrack(60),
        wind: windFrom(0),
        sessionStartMs: 0,
      });
      expect(result?.crosswindPct).toBe(100);
      expect(result?.headwindPct).toBe(0);
      expect(result?.tailwindPct).toBe(0);
    });

    it('splits ~50/50 head vs tail on an out-and-back with steady wind', () => {
      const east = Array.from({ length: 101 }, (_, i) => 11 + i * 0.001);
      const west = Array.from({ length: 100 }, (_, i) => 11.1 - (i + 1) * 0.001);
      const result = windExposureFromRecords({
        records: trackFromLngs([...east, ...west]),
        wind: windFrom(90),
        sessionStartMs: 0,
      });
      expect(result).not.toBeNull();
      if (!result) return;
      expect(result.headwindPct).toBe(50);
      expect(result.tailwindPct).toBe(50);
      expect(result.crosswindPct).toBe(0);
    });

    it('always returns three percentages that sum to 100', () => {
      for (const dir of [0, 30, 45, 90, 135, 200, 270, 315]) {
        const result = windExposureFromRecords({
          records: eastTrack(80),
          wind: windFrom(dir),
          sessionStartMs: 0,
        });
        expect(result).not.toBeNull();
        if (!result) continue;
        expect(result.headwindPct + result.crosswindPct + result.tailwindPct).toBe(100);
      }
    });

    it('matches each segment to the nearest-in-time wind sample', () => {
      const wind: WindSample[] = [
        { timeMs: 0, directionDegrees: 90 },
        { timeMs: 120_000, directionDegrees: 270 },
      ];
      const result = windExposureFromRecords({ records: eastTrack(241), wind, sessionStartMs: 0 });
      expect(result).not.toBeNull();
      if (!result) return;
      expect(result.headwindPct).toBeGreaterThan(0);
      expect(result.tailwindPct).toBeGreaterThan(0);
      expect(result.crosswindPct).toBe(0);
      expect(result.headwindPct + result.tailwindPct).toBe(100);
    });

    it('skips long pauses without corrupting the split', () => {
      const records: SessionRecord[] = [
        createMockSessionRecord({ timestamp: 0, lat: 48, lng: 11.0 }),
        createMockSessionRecord({ timestamp: 1, lat: 48, lng: 11.001 }),
        createMockSessionRecord({ timestamp: 1001, lat: 48, lng: 12.0 }),
        createMockSessionRecord({ timestamp: 1002, lat: 48, lng: 12.001 }),
      ];
      const result = windExposureFromRecords({ records, wind: windFrom(90), sessionStartMs: 0 });
      expect(result).not.toBeNull();
      if (!result) return;
      expect(result.headwindPct).toBe(100);
      expect(result.movingSec).toBe(2);
    });

    it('returns null for a stationary track (no real movement)', () => {
      const stationary = trackFromLngs(Array.from({ length: 30 }, () => 11));
      expect(
        windExposureFromRecords({ records: stationary, wind: windFrom(90), sessionStartMs: 0 }),
      ).toBeNull();
    });

    it('returns null when there is no GPS data', () => {
      expect(
        windExposureFromRecords({
          records: indoorRecordSeries(50),
          wind: windFrom(90),
          sessionStartMs: 0,
        }),
      ).toBeNull();
    });

    it('returns null when there are no wind samples', () => {
      expect(
        windExposureFromRecords({ records: eastTrack(60), wind: [], sessionStartMs: 0 }),
      ).toBeNull();
    });

    it('returns null for fewer than two GPS points', () => {
      expect(
        windExposureFromRecords({ records: eastTrack(1), wind: windFrom(90), sessionStartMs: 0 }),
      ).toBeNull();
    });
  });

  describe(windAngles.name, () => {
    it('gives each record the wind angle of the segment that ends there and skips pauses', () => {
      const records: SessionRecord[] = [
        createMockSessionRecord({ timestamp: 0, lat: 48, lng: 11.0 }),
        createMockSessionRecord({ timestamp: 1, lat: 48, lng: 11.001 }),
        createMockSessionRecord({ timestamp: 2, lat: 48, lng: 11.0 }),
        createMockSessionRecord({ timestamp: 1002, lat: 48, lng: 11.001 }),
      ];
      const angles = windAngles({ records, wind: windFrom(90), sessionStartMs: 0 });
      expect(angles[0]).toBeUndefined();
      expect(angles[1]).toBeCloseTo(0, 0);
      expect(angles[2]).toBeCloseTo(180, 0);
      expect(angles[3]).toBeUndefined();
    });
  });

  describe(relativeWindAngles.name, () => {
    it('gives wind from the right a positive and wind from the left a negative angle', () => {
      const fromSouth = relativeWindAngles({
        records: eastTrack(3),
        wind: windFrom(180),
        sessionStartMs: 0,
      });
      const fromNorth = relativeWindAngles({
        records: eastTrack(3),
        wind: windFrom(0),
        sessionStartMs: 0,
      });
      expect(fromSouth[1]?.angle).toBeCloseTo(90, 0);
      expect(fromNorth[1]?.angle).toBeCloseTo(-90, 0);
    });

    it('weights each moving record by its segment seconds and skips pauses', () => {
      const records: SessionRecord[] = [
        createMockSessionRecord({ timestamp: 0, lat: 48, lng: 11.0 }),
        createMockSessionRecord({ timestamp: 2, lat: 48, lng: 11.001 }),
        createMockSessionRecord({ timestamp: 1002, lat: 48, lng: 11.002 }),
      ];
      const relative = relativeWindAngles({ records, wind: windFrom(90), sessionStartMs: 0 });
      expect(relative[0]).toBeUndefined();
      expect(relative[1]?.durationSec).toBe(2);
      expect(relative[1]?.angle).toBeCloseTo(0, 0);
      expect(relative[2]).toBeUndefined();
    });
  });
});
