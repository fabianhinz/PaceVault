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
  hasSeriesValues,
} from '@/lib/chartData.ts';
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

const mixed: SessionRecord[] = [
  { timestamp: 60, hr: 140, power: 200, speed: 3, cadence: 85, elevation: 100.04, grade: 2 },
  { timestamp: 120 },
  { timestamp: 180, hr: 0, power: 0, speed: 0, cadence: 0, elevation: 0, grade: 0 },
];

describe('prepare*Data', () => {
  it('returns exactly one point per record for every series', () => {
    for (const prepare of [
      prepareHrData,
      preparePowerData,
      prepareSpeedData,
      prepareCadenceData,
      prepareElevationData,
      prepareGradeData,
      preparePaceData,
      prepareGAPData,
    ]) {
      expect(prepare(mixed).map((p) => p.time)).toEqual([1, 2, 3]);
    }
  });

  it('returns no points for no records', () => {
    expect(prepareHrData([])).toEqual([]);
  });
});

describe('prepareHrData', () => {
  it('keeps 0 and maps missing hr to null', () => {
    expect(prepareHrData(mixed).map((p) => p.hr)).toEqual([140, null, 0]);
  });
});

describe('preparePowerData', () => {
  it('keeps 0 and maps missing power to null', () => {
    expect(preparePowerData(mixed).map((p) => p.power)).toEqual([200, null, 0]);
  });

  it('keeps power above the sensor-warning threshold as recorded', () => {
    expect(preparePowerData([{ timestamp: 0, power: 3000 }])[0]?.power).toBe(3000);
  });
});

describe('prepareSpeedData', () => {
  it('converts m/s to km/h, keeps 0 and maps missing speed to null', () => {
    expect(prepareSpeedData(mixed).map((p) => p.speed)).toEqual([10.8, null, 0]);
  });
});

describe('prepareCadenceData', () => {
  it('keeps 0 and maps missing cadence to null', () => {
    expect(prepareCadenceData(mixed).map((p) => p.cadence)).toEqual([85, null, 0]);
  });
});

describe('prepareElevationData', () => {
  it('rounds to one decimal, keeps 0 and maps missing elevation to null', () => {
    expect(prepareElevationData(mixed).map((p) => p.elevation)).toEqual([100, null, 0]);
  });
});

describe('prepareGradeData', () => {
  it('keeps 0 and maps missing grade to null', () => {
    expect(prepareGradeData(mixed).map((p) => p.grade)).toEqual([2, null, 0]);
  });
});

describe('preparePaceData', () => {
  it('converts speed (m/s) to pace (min/km)', () => {
    expect(preparePaceData([{ timestamp: 60, speed: 1000 / 300 }])[0]?.pace).toBe(5);
  });

  it('is null only when speed is missing or 0', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 0.3 },
      { timestamp: 60, speed: 0 },
      { timestamp: 120 },
    ];
    expect(preparePaceData(records).map((p) => p.pace)).toEqual([55.56, null, null]);
  });
});

describe('prepareGAPData', () => {
  it('gap is lower (faster) than pace uphill', () => {
    const point = prepareGAPData([{ timestamp: 0, speed: 3.5, grade: 10 }])[0];
    expect(point?.gap).toBeLessThan(point?.pace ?? 0);
  });

  it('gap is higher (slower) than pace downhill', () => {
    const point = prepareGAPData([{ timestamp: 0, speed: 3.5, grade: -10 }])[0];
    expect(point?.gap).toBeGreaterThan(point?.pace ?? 0);
  });

  it('falls back to the elevation delta to the previous record', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 3.5, elevation: 100, distance: 0 },
      { timestamp: 60, speed: 3.5, elevation: 110, distance: 100 },
    ];
    const point = prepareGAPData(records)[1];
    expect(point?.gap).toBeLessThan(point?.pace ?? 0);
  });

  it('gap is null without a gradient, pace stays', () => {
    const records: SessionRecord[] = [
      { timestamp: 0, speed: 3.5 },
      { timestamp: 60, speed: 3.5, elevation: 110, distance: 100 },
    ];
    const result = prepareGAPData(records);
    expect(result.map((p) => p.gap)).toEqual([null, null]);
    expect(result.every((p) => p.pace !== null)).toBe(true);
  });

  it('pace and gap are null at speed 0', () => {
    expect(prepareGAPData([{ timestamp: 0, speed: 0, grade: 5 }])[0]).toEqual({
      time: 0,
      pace: null,
      gap: null,
    });
  });
});

describe('hasSeriesValues', () => {
  it('is true when at least one value is not null, including 0', () => {
    expect(hasSeriesValues([{ hr: null }, { hr: 0 }], 'hr')).toBe(true);
  });

  it('is false when every value is null', () => {
    expect(hasSeriesValues([{ hr: null }], 'hr')).toBe(false);
  });
});
