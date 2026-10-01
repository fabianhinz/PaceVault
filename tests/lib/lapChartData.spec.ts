import { describe, it, expect } from 'vitest';
import { prepareLapSplitsData, prepareLapHrData, prepareLapPowerData } from '@/lib/lapChartData.ts';
import { analyzeLaps, enrichAllLaps, type LapRecordEnrichment } from '@/lib/laps.ts';
import { makeLaps, makeCyclingRecords, makeRunningRecords } from '@tests/factories/records.ts';

describe('prepareLapSplitsData', () => {
  it('converts laps to split points with pace, speed, and max values', () => {
    const laps = makeLaps(5).map((l) => ({ ...l, intensity: 'active' as const }));
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('lap');
    expect(result[0]).toHaveProperty('pace');
    expect(result[0]).toHaveProperty('speed');
    expect(result[0]).toHaveProperty('maxPace');
    expect(result[0]).toHaveProperty('maxSpeed');
    // Without enrichments, range fields are undefined
    expect(result[0].paceRange).toBeUndefined();
    expect(result[0].speedRange).toBeUndefined();
  });

  it('labels laps sequentially', () => {
    const laps = makeLaps(3).map((l) => ({ ...l, intensity: 'active' as const }));
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    expect(result.map((r) => r.lap)).toEqual(['Lap 1', 'Lap 2', 'Lap 3']);
  });

  it('filters out laps with zero distance', () => {
    const laps = makeLaps(3).map((l) => ({ ...l, intensity: 'active' as const }));
    laps[1].distance = 0;
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    expect(result).toHaveLength(2);
  });

  it('derives speed from paceSecPerKm consistently with pace', () => {
    const laps = makeLaps(1).map((l) => ({ ...l, intensity: 'active' as const }));
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    // pace is sec/km, speed is km/h = 3600 / pace
    expect(result[0].speed).toBeCloseTo(3600 / result[0].pace, 1);
  });

  it('derives maxSpeed and maxPace from LapAnalysis.maxSpeed', () => {
    const laps = makeLaps(1).map((l) => ({ ...l, intensity: 'active' as const }));
    // makeLaps sets maxSpeed to 4.0 m/s for the first lap
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    // maxSpeed in km/h = 4.0 * 3.6 = 14.4
    expect(result[0].maxSpeed).toBeCloseTo(14.4, 1);
    // maxPace in sec/km = 1000 / 4.0 = 250
    expect(result[0].maxPace).toBeCloseTo(250, 0);
  });

  it('falls back to avg values when maxSpeed is undefined', () => {
    const laps = makeLaps(1).map((l) => ({ ...l, intensity: 'active' as const }));
    laps[0].maxSpeed = undefined;
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    expect(result[0].maxSpeed).toBe(result[0].speed);
    expect(result[0].maxPace).toBe(result[0].pace);
  });

  it('returns empty for empty laps', () => {
    expect(prepareLapSplitsData([])).toHaveLength(0);
  });

  it('excludes rest laps from splits data', () => {
    const laps = makeLaps(5);
    // makeLaps sets intensity 'rest' at indices 0, 3 — so 3 active laps
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.lap)).toEqual(['Lap 2', 'Lap 3', 'Lap 5']);
  });

  it('populates minSpeed/minPace and range fields from enrichments', () => {
    const laps = makeLaps(5).map((l) => ({ ...l, intensity: 'active' as const }));
    const records = makeRunningRecords(1500);
    const analysis = analyzeLaps(laps);
    const enrichments = enrichAllLaps(laps, records);
    const result = prepareLapSplitsData(analysis, enrichments);
    expect(result.length).toBeGreaterThan(0);
    const withMin = result.filter((r) => r.minSpeed !== undefined);
    expect(withMin.length).toBeGreaterThan(0);
    withMin.forEach((r) => {
      expect(r.minPace).toBeDefined();
      expect(r.minSpeed ?? 0).toBeGreaterThan(0);
      expect(r.minPace ?? 0).toBeGreaterThan(0);
      // Range fields populated when min data exists
      expect(r.paceRange).toBeDefined();
      expect(r.paceRange?.[0]).toBe(r.maxPace);
      expect(r.paceRange?.[1]).toBe(r.minPace);
      expect(r.speedRange).toBeDefined();
      expect(r.speedRange?.[0]).toBe(r.minSpeed);
      expect(r.speedRange?.[1]).toBe(r.maxSpeed);
    });
  });

  it('leaves minSpeed/minPace undefined without enrichments', () => {
    const laps = makeLaps(3).map((l) => ({ ...l, intensity: 'active' as const }));
    const analysis = analyzeLaps(laps);
    const result = prepareLapSplitsData(analysis);
    result.forEach((r) => {
      expect(r.minSpeed).toBeUndefined();
      expect(r.minPace).toBeUndefined();
    });
  });
});

describe('prepareLapHrData', () => {
  it('groups avg/min/max HR per lap with hrRange', () => {
    const analysis = analyzeLaps(makeLaps(4));
    const result = prepareLapHrData(analysis);
    expect(result).toHaveLength(4);
    expect(result[0]).toHaveProperty('avgHr');
    expect(result[0]).toHaveProperty('minHr');
    expect(result[0]).toHaveProperty('maxHr');
    expect(result[0].hrRange).toEqual([result[0].minHr, result[0].maxHr]);
  });

  it('uses avgHr as fallback for missing min/max', () => {
    const laps = makeLaps(1);
    laps[0].minHr = undefined;
    laps[0].maxHr = undefined;
    laps[0].avgHr = 150;
    const analysis = analyzeLaps(laps);
    const result = prepareLapHrData(analysis);
    expect(result[0].minHr).toBe(150);
    expect(result[0].maxHr).toBe(150);
    expect(result[0].hrRange).toEqual([150, 150]);
  });

  it('filters out laps without HR data', () => {
    const laps = makeLaps(3);
    laps[1].avgHr = undefined;
    const analysis = analyzeLaps(laps);
    const result = prepareLapHrData(analysis);
    expect(result).toHaveLength(2);
  });

  it('returns empty for empty laps', () => {
    expect(prepareLapHrData([])).toHaveLength(0);
  });

  it('prefers enrichment minHr over FIT summary minHr', () => {
    const laps = makeLaps(1);
    laps[0].avgHr = 150;
    laps[0].minHr = 80; // unrealistic FIT summary value
    laps[0].maxHr = 170;
    const analysis = analyzeLaps(laps);
    const enrichments: LapRecordEnrichment[] = [
      {
        lapIndex: 0,
        minSpeed: undefined,
        avgPower: undefined,
        minPower: undefined,
        maxPower: undefined,
        minCadence: undefined,
        minHr: 138,
      },
    ];
    const result = prepareLapHrData(analysis, enrichments);
    expect(result[0].minHr).toBe(138);
    expect(result[0].hrRange).toEqual([138, 170]);
  });

  it('falls back to FIT summary minHr when enrichment has no minHr', () => {
    const laps = makeLaps(1);
    laps[0].avgHr = 150;
    laps[0].minHr = 130;
    laps[0].maxHr = 170;
    const analysis = analyzeLaps(laps);
    const enrichments: LapRecordEnrichment[] = [
      {
        lapIndex: 0,
        minSpeed: undefined,
        avgPower: undefined,
        minPower: undefined,
        maxPower: undefined,
        minCadence: undefined,
        minHr: undefined,
      },
    ];
    const result = prepareLapHrData(analysis, enrichments);
    expect(result[0].minHr).toBe(130);
  });
});

describe('prepareLapPowerData', () => {
  it('produces power points from cycling enrichments with powerRange', () => {
    const laps = makeLaps(5);
    const records = makeCyclingRecords(1500);
    const enrichments = enrichAllLaps(laps, records);
    const result = prepareLapPowerData(enrichments);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((p) => {
      expect(p.avgPower).toBeDefined();
      expect(p.minPower).toBeLessThanOrEqual(p.avgPower);
      expect(p.maxPower).toBeGreaterThanOrEqual(p.avgPower);
      expect(p.powerRange).toEqual([p.minPower, p.maxPower]);
    });
  });

  it('filters out enrichments without power data', () => {
    const enrichments: LapRecordEnrichment[] = [
      {
        lapIndex: 0,
        minSpeed: 3.0,
        avgPower: 200,
        minPower: 180,
        maxPower: 240,
        minCadence: 80,
        minHr: 135,
      },
      {
        lapIndex: 1,
        minSpeed: 3.2,
        avgPower: undefined,
        minPower: undefined,
        maxPower: undefined,
        minCadence: 82,
        minHr: 140,
      },
    ];
    const result = prepareLapPowerData(enrichments);
    expect(result).toHaveLength(1);
    expect(result[0].lap).toBe('Lap 1');
  });

  it('returns empty for empty input', () => {
    expect(prepareLapPowerData([])).toHaveLength(0);
  });
});
