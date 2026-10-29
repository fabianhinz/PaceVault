import { describe, it, expect } from 'vite-plus/test';
import { buildSessionChartRows, TARGET_ROWS } from '@/components/charts/chartData.ts';
import { buildSessionTerrain } from '@/components/charts/sessionTerrain.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { cyclingRecordSeries } from '@pacevault/testing/series.ts';

const HOUR = 3600;
const MISSING_POWER = 19;

const makeLongRideWithStops = (): SessionRecord[] =>
  cyclingRecordSeries({ count: 6 * HOUR }).map((r, i) => {
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
    const records = makeLongRideWithStops();
    const rows = buildSessionChartRows(records, {
      running: false,
      terrain: buildSessionTerrain({ sport: 'cycling', records }),
    });
    expect(rows.length).toBeLessThanOrEqual(TARGET_ROWS + 2);
    expect(rows.filter((r) => !('hr' in r && 'power' in r && 'speed' in r))).toEqual([]);
  });

  it('keeps the recorded zeros of the stops and the true power peak', () => {
    const records = makeLongRideWithStops();
    const rows = buildSessionChartRows(records, {
      running: false,
      terrain: buildSessionTerrain({ sport: 'cycling', records }),
    });
    const recordedMax = Math.max(...records.map((r) => r.power ?? -Infinity));
    expect(rows.filter((r) => r.power === 0)).not.toEqual([]);
    expect(Math.max(...rows.map((r) => r.power ?? -Infinity))).toBe(recordedMax);
  });
});
