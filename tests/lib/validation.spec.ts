import { describe, it, expect } from 'vitest';
import { validateRecords } from '@/lib/validation.ts';
import {
  makeCyclingRecords,
  makeRunningRecords,
  makeInvalidRecords,
} from '@tests/factories/records.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const makeRecord = (overrides: Partial<SessionRecord>): SessionRecord => ({
  timestamp: 0,
  ...overrides,
});

describe('validateRecords', () => {
  it('produces no warnings for clean cycling records', () => {
    const records = makeCyclingRecords(60);
    const warnings = validateRecords(records, 'cycling');
    expect(warnings).toEqual([]);
  });

  it('produces no warnings for clean running records', () => {
    const records = makeRunningRecords(60);
    const warnings = validateRecords(records, 'running');
    expect(warnings).toEqual([]);
  });

  it('warns when HR exceeds 230 in more than 10 records', () => {
    const records = makeInvalidRecords('highHr');
    const warnings = validateRecords(records, 'cycling');
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
      records.push(makeRecord({ timestamp: i, hr: 240 }));
    }
    for (let i = 10; i < 20; i++) {
      records.push(makeRecord({ timestamp: i, hr: 150 }));
    }
    const warnings = validateRecords(records, 'cycling');
    expect(warnings).toEqual([]);
  });

  it('warns when all HR values are zero', () => {
    const records = makeInvalidRecords('zeroHr');
    const warnings = validateRecords(records, 'cycling');
    expect(warnings).toContainEqual({ code: 'hr_all_zero' });
  });

  it('warns when power exceeds 2500W in more than 10 records', () => {
    const records = makeInvalidRecords('highPower');
    const warnings = validateRecords(records, 'cycling');
    expect(warnings.find((w) => w.code === 'power_above_max')).toMatchObject({ limit: 2500 });
  });

  it('warns when cycling speed exceeds 80 km/h in more than 10 records', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 15; i++) {
      records.push(makeRecord({ timestamp: i, speed: 25 }));
    }
    const warnings = validateRecords(records, 'cycling');
    expect(warnings).toEqual([{ code: 'speed_above_max', limit: 80, count: 15 }]);
  });

  it('warns when running speed exceeds 25 km/h in more than 10 records', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 15; i++) {
      records.push(makeRecord({ timestamp: i, speed: 8.33 }));
    }
    const warnings = validateRecords(records, 'running');
    expect(warnings).toEqual([{ code: 'speed_above_max', limit: 25, count: 15 }]);
  });

  it('returns multiple warnings when multiple sensor issues exist', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 20; i++) {
      records.push(makeRecord({ timestamp: i, hr: 240, power: 3000 }));
    }
    const warnings = validateRecords(records, 'cycling');
    expect(warnings).toEqual([
      { code: 'hr_above_max', limit: 230, count: 20 },
      { code: 'power_above_max', limit: 2500, count: 20 },
    ]);
  });
});
