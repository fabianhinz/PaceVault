import { describe, it, expect } from 'vite-plus/test';
import { validateRecords } from '@/lib/validation.ts';
import {
  cyclingRecordSeries,
  runningRecordSeries,
  invalidRecordSeries,
} from '@pacevault/testing/series.ts';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';

describe(validateRecords.name, () => {
  it('produces no warnings for clean cycling records', () => {
    const records = cyclingRecordSeries({ count: 60 });
    const warnings = validateRecords({ records, sport: 'cycling' });
    expect(warnings).toEqual([]);
  });

  it('produces no warnings for clean running records', () => {
    const records = runningRecordSeries({ count: 60 });
    const warnings = validateRecords({ records, sport: 'running' });
    expect(warnings).toEqual([]);
  });

  it('warns when HR exceeds 230 in more than 10 records', () => {
    const records = invalidRecordSeries('highHr');
    const warnings = validateRecords({ records, sport: 'cycling' });
    expect(warnings).toEqual([
      {
        code: 'hr_above_max',
        limit: 230,
        count: records.filter((r) => r.hr !== undefined && r.hr > 230).length,
      },
    ]);
  });

  it('does not warn when HR exceeds 230 in exactly 10 records', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 10; i++) {
      records.push(createMockSessionRecord({ timestamp: i, hr: 240 }));
    }
    for (let i = 10; i < 20; i++) {
      records.push(createMockSessionRecord({ timestamp: i, hr: 150 }));
    }
    const warnings = validateRecords({ records, sport: 'cycling' });
    expect(warnings).toEqual([]);
  });

  it('warns when all HR values are zero', () => {
    const records = invalidRecordSeries('zeroHr');
    const warnings = validateRecords({ records, sport: 'cycling' });
    expect(warnings).toContainEqual({ code: 'hr_all_zero' });
  });

  it('warns when power exceeds 2500W in more than 10 records', () => {
    const records = invalidRecordSeries('highPower');
    const warnings = validateRecords({ records, sport: 'cycling' });
    expect(warnings.find((w) => w.code === 'power_above_max')).toMatchObject({ limit: 2500 });
  });

  it('warns when cycling speed exceeds 80 km/h in more than 10 records', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 15; i++) {
      records.push(createMockSessionRecord({ timestamp: i, speed: 25 }));
    }
    const warnings = validateRecords({ records, sport: 'cycling' });
    expect(warnings).toEqual([{ code: 'speed_above_max', limit: 80, count: 15 }]);
  });

  it('warns when running speed exceeds 25 km/h in more than 10 records', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 15; i++) {
      records.push(createMockSessionRecord({ timestamp: i, speed: 8.33 }));
    }
    const warnings = validateRecords({ records, sport: 'running' });
    expect(warnings).toEqual([{ code: 'speed_above_max', limit: 25, count: 15 }]);
  });

  it('returns multiple warnings when multiple sensor issues exist', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 20; i++) {
      records.push(createMockSessionRecord({ timestamp: i, hr: 240, power: 3000 }));
    }
    const warnings = validateRecords({ records, sport: 'cycling' });
    expect(warnings).toEqual([
      { code: 'hr_above_max', limit: 230, count: 20 },
      { code: 'power_above_max', limit: 2500, count: 20 },
    ]);
  });
});
