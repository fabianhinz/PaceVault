import { describe, it, expect } from 'vitest';
import { validateRecords, filterValidPower } from '@/lib/validation.ts';
import {
  makeCyclingRecords,
  makeRunningRecords,
  makeInvalidRecords,
} from '@tests/factories/records.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

function makeRecord(overrides: Partial<SessionRecord>): SessionRecord {
  return { sessionId: 'test', timestamp: 0, ...overrides };
}

describe('validateRecords', () => {
  it('produces no warnings for clean cycling records', () => {
    const records = makeCyclingRecords('s1', 60);
    const warnings = validateRecords(records, 'cycling');
    expect(warnings).toEqual([]);
  });

  it('produces no warnings for clean running records', () => {
    const records = makeRunningRecords('s1', 60);
    const warnings = validateRecords(records, 'running');
    expect(warnings).toEqual([]);
  });

  it('warns when HR exceeds 230 in more than 10 records', () => {
    const records = makeInvalidRecords('s1', 'highHr');
    const warnings = validateRecords(records, 'cycling');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].field).toBe('hr');
    expect(warnings[0].message).toContain('230 bpm');
  });

  it('does not warn when HR exceeds 230 in exactly 10 records', () => {
    const records: SessionRecord[] = [];
    // 10 records with high HR (boundary — should NOT trigger)
    for (let i = 0; i < 10; i++) {
      records.push(makeRecord({ timestamp: i, hr: 240 }));
    }
    // 10 records with normal HR
    for (let i = 10; i < 20; i++) {
      records.push(makeRecord({ timestamp: i, hr: 150 }));
    }
    const warnings = validateRecords(records, 'cycling');
    const hrWarnings = warnings.filter((w) => w.field === 'hr');
    expect(hrWarnings).toHaveLength(0);
  });

  it('warns when all HR values are zero', () => {
    const records = makeInvalidRecords('s1', 'zeroHr');
    const warnings = validateRecords(records, 'cycling');
    expect(warnings.some((w) => w.message.includes('sensor not connected'))).toBe(true);
  });

  it('warns when power exceeds 2500W in more than 10 records', () => {
    const records = makeInvalidRecords('s1', 'highPower');
    const warnings = validateRecords(records, 'cycling');
    expect(warnings.some((w) => w.field === 'power')).toBe(true);
    expect(warnings.find((w) => w.field === 'power')?.message).toContain('2500W');
  });

  it('warns when cycling speed exceeds 80 km/h in more than 10 records', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 15; i++) {
      // 90 km/h = 25 m/s
      records.push(makeRecord({ timestamp: i, speed: 25 }));
    }
    const warnings = validateRecords(records, 'cycling');
    expect(warnings.some((w) => w.field === 'speed')).toBe(true);
    expect(warnings.find((w) => w.field === 'speed')?.message).toContain('80 km/h');
  });

  it('warns when running speed exceeds 25 km/h in more than 10 records', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 15; i++) {
      // 30 km/h = 8.33 m/s
      records.push(makeRecord({ timestamp: i, speed: 8.33 }));
    }
    const warnings = validateRecords(records, 'running');
    expect(warnings.some((w) => w.field === 'speed')).toBe(true);
    expect(warnings.find((w) => w.field === 'speed')?.message).toContain('25 km/h');
  });

  it('returns multiple warnings when multiple sensor issues exist', () => {
    const records: SessionRecord[] = [];
    for (let i = 0; i < 20; i++) {
      records.push(
        makeRecord({
          timestamp: i,
          hr: 240,
          power: 3000,
        }),
      );
    }
    const warnings = validateRecords(records, 'cycling');
    expect(warnings.length).toBeGreaterThanOrEqual(2);
    const fields = warnings.map((w) => w.field);
    expect(fields).toContain('hr');
    expect(fields).toContain('power');
  });
});

describe('filterValidPower', () => {
  it('keeps records with valid power between 1 and 2500', () => {
    const records = [
      makeRecord({ timestamp: 0, power: 200 }),
      makeRecord({ timestamp: 1, power: 1 }),
      makeRecord({ timestamp: 2, power: 2500 }),
    ];
    expect(filterValidPower(records)).toHaveLength(3);
  });

  it('removes records with undefined power', () => {
    const records = [
      makeRecord({ timestamp: 0, power: 200 }),
      makeRecord({ timestamp: 1, hr: 150 }),
    ];
    expect(filterValidPower(records)).toHaveLength(1);
  });

  it('removes records with zero power', () => {
    const records = [
      makeRecord({ timestamp: 0, power: 0 }),
      makeRecord({ timestamp: 1, power: 200 }),
    ];
    const result = filterValidPower(records);
    expect(result).toHaveLength(1);
    expect(result[0].power).toBe(200);
  });

  it('removes records with power exceeding 2500', () => {
    const records = [
      makeRecord({ timestamp: 0, power: 2501 }),
      makeRecord({ timestamp: 1, power: 200 }),
    ];
    const result = filterValidPower(records);
    expect(result).toHaveLength(1);
    expect(result[0].power).toBe(200);
  });

  it('returns empty array for empty input', () => {
    expect(filterValidPower([])).toEqual([]);
  });

  it('returns empty array when all records have invalid power', () => {
    const records = [
      makeRecord({ timestamp: 0, power: 0 }),
      makeRecord({ timestamp: 1, power: 3000 }),
      makeRecord({ timestamp: 2 }),
    ];
    expect(filterValidPower(records)).toHaveLength(0);
  });
});
