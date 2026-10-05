import { describe, it, expect } from 'vitest';
import { buildSessionChartRows } from '@/lib/chartData.ts';
import { TARGET_ROWS } from '@/lib/chartBuckets.ts';
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

describe('chart rows of a long session with many recorded zeros', () => {
  it('stays within the row budget on one shared grid', () => {
    const rows = buildSessionChartRows(makeLongRideWithStops(), { isRunning: false });
    expect(rows.length).toBeLessThanOrEqual(TARGET_ROWS + 2);
    expect(rows.every((r) => 'hr' in r && 'power' in r && 'speed' in r)).toBe(true);
  });

  it('keeps the recorded zeros of the stops and the true power peak', () => {
    const records = makeLongRideWithStops();
    const rows = buildSessionChartRows(records, { isRunning: false });
    const recordedMax = Math.max(...records.map((r) => r.power ?? -Infinity));
    expect(rows.some((r) => r.power === 0)).toBe(true);
    expect(Math.max(...rows.map((r) => r.power ?? -Infinity))).toBe(recordedMax);
  });
});
