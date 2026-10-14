import { describe, it, expect } from 'vitest';
import { computeRunningZones, getZoneForPace, getZoneMidPace } from '@/packages/engine/zones.ts';

describe('computeRunningZones', () => {
  // 4:30/km = 270 sec/km — typical threshold for a recreational runner
  const zones = computeRunningZones(270);

  it('returns 5 zones', () => {
    expect(zones).toHaveLength(5);
  });

  it('zone names are in correct order', () => {
    expect(zones.map((z) => z.name)).toEqual(['recovery', 'easy', 'tempo', 'threshold', 'vo2max']);
  });

  it('recovery zone is slowest (highest sec/km)', () => {
    const recovery = zones[0];
    expect(recovery.minPace).toBeGreaterThan(recovery.maxPace);
    expect(recovery.minPace).toBe(Math.round(270 * 1.4)); // 378
  });

  it('vo2max zone is fastest (lowest sec/km)', () => {
    const vo2max = zones[4];
    expect(vo2max.maxPace).toBe(Math.round(270 * 0.86)); // 232
  });

  it('zones are contiguous (each maxPace equals next minPace)', () => {
    for (let i = 0; i < zones.length - 1; i++) {
      expect(zones[i].maxPace).toBe(zones[i + 1].minPace);
    }
  });

  it('threshold zone brackets the input pace', () => {
    const threshold = zones.find((z) => z.name === 'threshold');
    expect(threshold?.minPace).toBeGreaterThanOrEqual(270);
    expect(threshold?.maxPace).toBeLessThanOrEqual(270);
  });

  it('each zone has a color', () => {
    zones.forEach((z) => {
      expect(z.color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });
});

describe('computeRunningZones edge cases', () => {
  it('handles very fast threshold pace (2:30/km = 150s)', () => {
    const zones = computeRunningZones(150);
    expect(zones[0].minPace).toBe(Math.round(150 * 1.4)); // 210
    expect(zones[4].maxPace).toBe(Math.round(150 * 0.86)); // 129
  });

  it('handles very slow threshold pace (9:00/km = 540s)', () => {
    const zones = computeRunningZones(540);
    expect(zones[0].minPace).toBe(Math.round(540 * 1.4)); // 756
    expect(zones[4].maxPace).toBe(Math.round(540 * 0.86)); // 464
  });
});

describe('getZoneForPace', () => {
  const zones = computeRunningZones(270);

  it('returns threshold zone for threshold pace', () => {
    const zone = getZoneForPace(270, zones);
    expect(zone?.name).toBe('threshold');
  });

  it('returns recovery zone for slow pace', () => {
    const zone = getZoneForPace(370, zones);
    expect(zone?.name).toBe('recovery');
  });

  it('returns vo2max zone for fast pace', () => {
    const zone = getZoneForPace(240, zones);
    expect(zone?.name).toBe('vo2max');
  });

  it('returns undefined for pace outside all zones', () => {
    const tooSlow = getZoneForPace(400, zones);
    expect(tooSlow).toBeUndefined();
    const tooFast = getZoneForPace(200, zones);
    expect(tooFast).toBeUndefined();
  });
});

describe('getZoneMidPace', () => {
  const zones = computeRunningZones(270);

  it('returns midpoint of zone pace range', () => {
    const threshold = zones.find((z) => z.name === 'threshold');
    if (!threshold) return expect(threshold).toBeDefined();
    const mid = getZoneMidPace(threshold);
    expect(mid).toBe(Math.round((threshold.minPace + threshold.maxPace) / 2));
  });
});
