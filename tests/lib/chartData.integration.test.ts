import { describe, it, expect } from 'vitest';
import { downsample } from '@/lib/downsample.ts';
import {
  prepareHrData,
  preparePowerData,
  prepareSpeedData,
  prepareCadenceData,
  prepareElevationData,
  prepareGradeData,
  preparePaceData,
  prepareGAPData,
} from '@/lib/chartData.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { makeCyclingRecords } from '@tests/factories/records.ts';

const HOUR = 3600;
const MISSING_POWER = 19;

const makeLongRideWithStops = (): SessionRecord[] =>
  makeCyclingRecords(6 * HOUR).map((r, i) => {
    if (i < MISSING_POWER) {
      const withoutPower: SessionRecord = { ...r };
      delete withoutPower.power;
      return withoutPower;
    }
    if (i % HOUR >= 40 * 60) {
      return { ...r, power: 0, cadence: 0, speed: 0 };
    }
    return r;
  });

const PREPARERS = [
  prepareHrData,
  preparePowerData,
  prepareSpeedData,
  prepareCadenceData,
  prepareElevationData,
  prepareGradeData,
  preparePaceData,
  prepareGAPData,
];

describe('chart series of a long session with many recorded zeros', () => {
  it('every series has one point per record, so synced charts stay index-aligned', () => {
    const records = makeLongRideWithStops();
    for (const input of [records, downsample(records)]) {
      const lengths = PREPARERS.map((prepare) => prepare(input).length);
      expect(new Set(lengths)).toEqual(new Set([input.length]));
    }
  });

  it('keeps recorded zeros and maps only missing values to null', () => {
    const power = preparePowerData(makeLongRideWithStops());
    expect(power.filter((p) => p.power === null)).toHaveLength(MISSING_POWER);
    expect(power.filter((p) => p.power === 0)).toHaveLength(6 * 20 * 60);
  });
});
