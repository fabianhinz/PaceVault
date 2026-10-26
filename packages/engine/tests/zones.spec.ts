import { describe, it, expect } from 'vite-plus/test';
import {
  runningZonesFromThresholdPace,
  secondsInZones,
  zoneForPace,
  zoneMidPace,
} from '../src/zones.ts';
import { createMockSessionRecord } from '../../testing/src/records.ts';

describe('zones', () => {
  describe(runningZonesFromThresholdPace.name, () => {
    const zones = runningZonesFromThresholdPace(270);

    it('returns 5 zones', () => {
      expect(zones).toHaveLength(5);
    });

    it('zone names are in correct order', () => {
      expect(zones.map((z) => z.name)).toEqual([
        'recovery',
        'easy',
        'tempo',
        'threshold',
        'vo2max',
      ]);
    });

    it('recovery zone is slowest (highest sec/km)', () => {
      const recovery = zones[0];
      expect(recovery.slowestPaceSecPerKm).toBeGreaterThan(recovery.fastestPaceSecPerKm);
      expect(recovery.slowestPaceSecPerKm).toBe(Math.round(270 * 1.4));
    });

    it('vo2max zone is fastest (lowest sec/km)', () => {
      const vo2max = zones[4];
      expect(vo2max.fastestPaceSecPerKm).toBe(Math.round(270 * 0.86));
    });

    it('zones are contiguous (each fastestPaceSecPerKm equals the next slowestPaceSecPerKm)', () => {
      for (let i = 0; i < zones.length - 1; i++) {
        expect(zones[i].fastestPaceSecPerKm).toBe(zones[i + 1].slowestPaceSecPerKm);
      }
    });

    it('threshold zone brackets the input pace', () => {
      const threshold = zones.find((z) => z.name === 'threshold');
      expect(threshold?.slowestPaceSecPerKm).toBeGreaterThanOrEqual(270);
      expect(threshold?.fastestPaceSecPerKm).toBeLessThanOrEqual(270);
    });

    describe('edge cases', () => {
      it('handles very fast threshold pace (2:30/km = 150s)', () => {
        const zones = runningZonesFromThresholdPace(150);
        expect(zones[0].slowestPaceSecPerKm).toBe(Math.round(150 * 1.4));
        expect(zones[4].fastestPaceSecPerKm).toBe(Math.round(150 * 0.86));
      });

      it('handles very slow threshold pace (9:00/km = 540s)', () => {
        const zones = runningZonesFromThresholdPace(540);
        expect(zones[0].slowestPaceSecPerKm).toBe(Math.round(540 * 1.4));
        expect(zones[4].fastestPaceSecPerKm).toBe(Math.round(540 * 0.86));
      });
    });
  });

  describe(zoneForPace.name, () => {
    const zones = runningZonesFromThresholdPace(270);

    it('returns threshold zone for threshold pace', () => {
      const zone = zoneForPace({ paceSecPerKm: 270, zones });
      expect(zone?.name).toBe('threshold');
    });

    it('returns recovery zone for slow pace', () => {
      const zone = zoneForPace({ paceSecPerKm: 370, zones });
      expect(zone?.name).toBe('recovery');
    });

    it('returns vo2max zone for fast pace', () => {
      const zone = zoneForPace({ paceSecPerKm: 240, zones });
      expect(zone?.name).toBe('vo2max');
    });

    it('returns undefined for pace outside all zones', () => {
      const tooSlow = zoneForPace({ paceSecPerKm: 400, zones });
      expect(tooSlow).toBeUndefined();
      const tooFast = zoneForPace({ paceSecPerKm: 200, zones });
      expect(tooFast).toBeUndefined();
    });
  });

  describe(zoneMidPace.name, () => {
    const zones = runningZonesFromThresholdPace(270);

    it('returns midpoint of zone pace range', () => {
      const threshold = zones.find((z) => z.name === 'threshold');
      if (!threshold) return expect(threshold).toBeDefined();
      const mid = zoneMidPace(threshold);
      expect(mid).toBe(
        Math.round((threshold.slowestPaceSecPerKm + threshold.fastestPaceSecPerKm) / 2),
      );
    });
  });

  describe(secondsInZones.name, () => {
    const zoneIndexAt = (hr: number): number => {
      if (hr < 150) return 0;
      return 1;
    };

    it('weights each record by its interval on smart recording and skips a 30 s gap', () => {
      const records = [
        createMockSessionRecord({ timestamp: 0, hr: 140 }),
        createMockSessionRecord({ timestamp: 1, hr: 140 }),
        createMockSessionRecord({ timestamp: 5, hr: 160 }),
        createMockSessionRecord({ timestamp: 35, hr: 160 }),
        createMockSessionRecord({ timestamp: 38, hr: 140 }),
      ];
      expect(secondsInZones({ records, zoneIndexAt, zoneCount: 2 })).toEqual([4, 4]);
    });
  });
});
