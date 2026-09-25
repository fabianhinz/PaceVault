import { describe, it, expect } from 'vitest';
import {
  prepareHrData,
  preparePowerData,
  prepareSpeedData,
  prepareCadenceData,
  prepareElevationData,
  prepareGradeData,
  preparePaceData,
  prepareGAPData,
  filterTimeSeries,
} from '@/lib/chartData.ts';
import { makeCyclingRecords, makeRunningRecords } from '@tests/factories/records.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

describe('filterTimeSeries', () => {
  const data = [
    { time: 1, hr: 100 },
    { time: 2, hr: 110 },
    { time: 3, hr: 120 },
    { time: 4, hr: 130 },
    { time: 5, hr: 140 },
  ];

  it('filters to inclusive range', () => {
    const result = filterTimeSeries(data, 2, 4);
    expect(result).toEqual([
      { time: 2, hr: 110 },
      { time: 3, hr: 120 },
      { time: 4, hr: 130 },
    ]);
  });

  it('returns empty array when no points in range', () => {
    expect(filterTimeSeries(data, 10, 20)).toEqual([]);
  });

  it('returns all points when range covers full data', () => {
    expect(filterTimeSeries(data, 0, 100)).toEqual(data);
  });

  it('returns single point when from equals to', () => {
    const result = filterTimeSeries(data, 3, 3);
    expect(result).toEqual([{ time: 3, hr: 120 }]);
  });
});

describe('prepareHrData', () => {
  it('converts records with hr to time-series points', () => {
    const records: SessionRecord[] = [
      { timestamp: 60, hr: 140 },
      { timestamp: 120, hr: 155 },
    ];
    const result = prepareHrData(records);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ time: 1, hr: 140 });
    expect(result[1]).toEqual({ time: 2, hr: 155 });
  });

  it('filters out records without hr or with hr=0', () => {
    const records: SessionRecord[] = [
      { timestamp: 60, hr: 140 },
      { timestamp: 120 },
      { timestamp: 180, hr: 0 },
    ];
    const result = prepareHrData(records);
    expect(result).toHaveLength(1);
    expect(result[0].hr).toBe(140);
  });

  it('returns empty array for records without hr data', () => {
    const records: SessionRecord[] = [{ timestamp: 0 }];
    expect(prepareHrData(records)).toHaveLength(0);
  });
});

describe('preparePowerData', () => {
  it('converts records with power to time-series points', () => {
    const records: SessionRecord[] = [
      { timestamp: 60, power: 200 },
      { timestamp: 120, power: 250 },
    ];
    const result = preparePowerData(records);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ time: 1, power: 200 });
    expect(result[1]).toEqual({ time: 2, power: 250 });
  });

  it('filters out records without power or with power=0', () => {
    const records: SessionRecord[] = [
      { timestamp: 60, power: 200 },
      { timestamp: 120 },
      { timestamp: 180, power: 0 },
    ];
    const result = preparePowerData(records);
    expect(result).toHaveLength(1);
    expect(result[0].power).toBe(200);
  });

  it('returns empty array for records without power data', () => {
    const records: SessionRecord[] = [{ timestamp: 0 }];
    expect(preparePowerData(records)).toHaveLength(0);
  });
});

describe('prepareSpeedData', () => {
  it('converts speed from m/s to km/h', () => {
    // 10 m/s = 36 km/h
    const records: SessionRecord[] = [{ timestamp: 60, speed: 10 }];
    const result = prepareSpeedData(records);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ time: 1, speed: 36 });
  });

  it('filters out records without speed or with speed=0', () => {
    const records: SessionRecord[] = [
      { timestamp: 60, speed: 5 },
      { timestamp: 120 },
      { timestamp: 180, speed: 0 },
    ];
    const result = prepareSpeedData(records);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for records without speed data', () => {
    const records: SessionRecord[] = [{ timestamp: 0 }];
    expect(prepareSpeedData(records)).toHaveLength(0);
  });
});

describe('prepareCadenceData', () => {
  it('converts records with cadence to time-series points', () => {
    const records = makeCyclingRecords(100);
    const result = prepareCadenceData(records);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('time');
    expect(result[0]).toHaveProperty('cadence');
  });

  it('filters out records without cadence', () => {
    const records: SessionRecord[] = [
      { timestamp: 60, cadence: 90 },
      { timestamp: 120 },
      { timestamp: 180, cadence: 0 },
    ];
    const result = prepareCadenceData(records);
    expect(result).toHaveLength(1);
    expect(result[0].time).toBe(1); // 60s = 1 min
    expect(result[0].cadence).toBe(90);
  });

  it('returns empty array for records without cadence data', () => {
    const records: SessionRecord[] = [{ timestamp: 0 }, { timestamp: 60 }];
    expect(prepareCadenceData(records)).toHaveLength(0);
  });
});

describe('prepareElevationData', () => {
  it('includes records with elevation', () => {
    const records = makeCyclingRecords(50);
    const result = prepareElevationData(records);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('elevation');
  });

  it('converts timestamp to minutes', () => {
    const records: SessionRecord[] = [{ timestamp: 120, elevation: 500 }];
    const result = prepareElevationData(records);
    expect(result[0].time).toBe(2); // 120s = 2 min
  });

  it('returns empty for no elevation data', () => {
    const records: SessionRecord[] = [{ timestamp: 0 }];
    expect(prepareElevationData(records)).toHaveLength(0);
  });
});

describe('prepareGradeData', () => {
  it('includes records with grade', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, grade: 5 },
      { timestamp: 60, grade: -3 },
      { timestamp: 120 },
    ];
    const result = prepareGradeData(records);
    expect(result).toHaveLength(2);
    expect(result[0].grade).toBe(5);
    expect(result[1].grade).toBe(-3);
  });

  it('returns empty for no grade data', () => {
    expect(prepareGradeData([])).toHaveLength(0);
  });
});

describe('preparePaceData', () => {
  it('converts speed (m/s) to pace (min/km)', () => {
    // 3.33 m/s = 300 sec/km = 5.0 min/km
    const records: SessionRecord[] = [{ timestamp: 60, speed: 1000 / 300 }];
    const result = preparePaceData(records);
    expect(result).toHaveLength(1);
    expect(result[0].pace).toBe(5);
  });

  it('filters out slow/standing records (speed <= 0.5 m/s)', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 0.3 },
      { timestamp: 60, speed: 0 },
      { timestamp: 120, speed: 3.5 },
    ];
    const result = preparePaceData(records);
    expect(result).toHaveLength(1);
  });

  it('returns empty when no speed data', () => {
    const records: SessionRecord[] = [{ timestamp: 0 }];
    expect(preparePaceData(records)).toHaveLength(0);
  });
});

describe('prepareGAPData', () => {
  it('produces both pace and gap values', () => {
    const records = makeRunningRecords(100);
    // Add grade data
    const withGrade = records.map((r, i) => ({ ...r, grade: 5 * Math.sin(i * 0.1) }));
    const result = prepareGAPData(withGrade);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('pace');
    expect(result[0]).toHaveProperty('gap');
  });

  it('gap differs from pace when grade is non-zero', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 3.5, grade: 10, distance: 0 },
      { timestamp: 60, speed: 3.5, grade: 10, distance: 210 },
    ];
    const result = prepareGAPData(records);
    expect(result.length).toBeGreaterThan(0);
    // 10% uphill grade → factor > 1 → gap should be lower (faster) than pace
    const point = result[result.length - 1];
    expect(point.gap).toBeLessThan(point.pace);
  });

  it('returns empty for fewer than 2 valid records', () => {
    const records: SessionRecord[] = [{ timestamp: 0, speed: 3.5, grade: 5 }];
    expect(prepareGAPData(records)).toHaveLength(0);
  });

  it('returns empty when no grade or elevation data', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 3.5 },
      { timestamp: 60, speed: 3.5 },
    ];
    expect(prepareGAPData(records)).toHaveLength(0);
  });

  it('downhill grade produces gap higher (slower) than pace', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 3.5, grade: -10, distance: 0 },
      { timestamp: 60, speed: 3.5, grade: -10, distance: 210 },
    ];
    const result = prepareGAPData(records);
    expect(result.length).toBeGreaterThan(0);
    const point = result[result.length - 1];
    expect(point.gap).toBeGreaterThan(point.pace);
  });
});
