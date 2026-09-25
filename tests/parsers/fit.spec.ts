import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  deriveDistanceFromRecords,
  deriveAvgFromRecords,
  deriveMaxFromRecords,
  parseFitFile,
} from '@/parsers/fit.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

function makeRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return { timestamp: 0, ...overrides };
}

describe('deriveDistanceFromRecords', () => {
  it('returns 0 for empty array', () => {
    expect(deriveDistanceFromRecords([])).toBe(0);
  });

  it('returns last record distance (cumulative)', () => {
    const records = [
      makeRecord({ distance: 100 }),
      makeRecord({ distance: 500 }),
      makeRecord({ distance: 1200 }),
    ];
    expect(deriveDistanceFromRecords(records)).toBe(1200);
  });

  it('skips trailing records with no distance', () => {
    const records = [makeRecord({ distance: 100 }), makeRecord({ distance: 800 }), makeRecord({})];
    expect(deriveDistanceFromRecords(records)).toBe(800);
  });

  it('returns 0 when no records have distance', () => {
    const records = [makeRecord({}), makeRecord({})];
    expect(deriveDistanceFromRecords(records)).toBe(0);
  });

  it('skips records with distance 0', () => {
    const records = [makeRecord({ distance: 500 }), makeRecord({ distance: 0 })];
    expect(deriveDistanceFromRecords(records)).toBe(500);
  });
});

describe('deriveAvgFromRecords', () => {
  it('returns undefined for empty array', () => {
    expect(deriveAvgFromRecords([], 'power')).toBeUndefined();
  });

  it('returns undefined when no records have the field', () => {
    const records = [makeRecord({}), makeRecord({})];
    expect(deriveAvgFromRecords(records, 'power')).toBeUndefined();
  });

  it('returns rounded mean of valid power values', () => {
    const records = [
      makeRecord({ power: 200 }),
      makeRecord({ power: 250 }),
      makeRecord({ power: 300 }),
    ];
    expect(deriveAvgFromRecords(records, 'power')).toBe(250);
  });

  it('skips zero values', () => {
    const records = [
      makeRecord({ power: 0 }),
      makeRecord({ power: 200 }),
      makeRecord({ power: 300 }),
    ];
    expect(deriveAvgFromRecords(records, 'power')).toBe(250);
  });

  it('returns rounded mean of valid cadence values', () => {
    const records = [
      makeRecord({ cadence: 80 }),
      makeRecord({ cadence: 85 }),
      makeRecord({ cadence: 83 }),
    ];
    expect(deriveAvgFromRecords(records, 'cadence')).toBe(83);
  });
});

describe('deriveMaxFromRecords', () => {
  it('returns undefined for empty array', () => {
    expect(deriveMaxFromRecords([], 'power')).toBeUndefined();
  });

  it('returns undefined when no records have the field', () => {
    const records = [makeRecord({}), makeRecord({})];
    expect(deriveMaxFromRecords(records, 'power')).toBeUndefined();
  });

  it('returns max power', () => {
    const records = [
      makeRecord({ power: 200 }),
      makeRecord({ power: 400 }),
      makeRecord({ power: 300 }),
    ];
    expect(deriveMaxFromRecords(records, 'power')).toBe(400);
  });

  it('returns max speed', () => {
    const records = [
      makeRecord({ speed: 3.0 }),
      makeRecord({ speed: 4.5 }),
      makeRecord({ speed: 3.8 }),
    ];
    expect(deriveMaxFromRecords(records, 'speed')).toBe(4.5);
  });

  it('skips zero values', () => {
    const records = [makeRecord({ power: 0 }), makeRecord({ power: 250 })];
    expect(deriveMaxFromRecords(records, 'power')).toBe(250);
  });
});

describe('parseFitFile session name', () => {
  const fixture = (): ArrayBuffer => {
    const buf = readFileSync(resolve('e2e/fixtures/running.fit'));
    const bytes = new Uint8Array(buf.byteLength);
    bytes.set(buf);
    return bytes.buffer;
  };

  const profile = { restHr: 48, maxHr: 188, gender: 'male' as const, ftp: 265 };

  it('derives the name from the filename when no meta is given', async () => {
    const result = await parseFitFile(fixture(), '15487122967_Lauf_am_Morgen.fit', profile);
    expect(result.session.name).toBe('Lauf am Morgen');
  });

  it('leaves the name unset when the filename carries none', async () => {
    const result = await parseFitFile(fixture(), 'i178993058.fit', profile);
    expect(result.session).not.toHaveProperty('name');
  });

  it('lets an intervals.icu name win over the filename', async () => {
    const result = await parseFitFile(fixture(), '15487122967_Lauf_am_Morgen.fit', profile, {
      name: 'Karlsruhe Laufen',
    });
    expect(result.session.name).toBe('Karlsruhe Laufen');
  });

  it('falls back to the filename when meta carries no name', async () => {
    const result = await parseFitFile(fixture(), '15487122967_Lauf_am_Morgen.fit', profile, {});
    expect(result.session.name).toBe('Lauf am Morgen');
  });
});

describe('parseFitFile records', () => {
  const fixture = (): ArrayBuffer => {
    const buf = readFileSync(resolve('e2e/fixtures/running.fit'));
    const bytes = new Uint8Array(buf.byteLength);
    bytes.set(buf);
    return bytes.buffer;
  };

  const profile = { restHr: 48, maxHr: 188, gender: 'male' as const, ftp: 265 };

  const decimals = (value: number): number => (String(value).split('.')[1] ?? '').length;

  it('stores only fields the device recorded, without a session id', async () => {
    const result = await parseFitFile(fixture(), 'run.fit', profile);

    expect(result.records.length).toBeGreaterThan(0);
    for (const record of result.records) {
      expect(record).not.toHaveProperty('sessionId');
      expect(Object.values(record).every((value) => value !== undefined)).toBe(true);
    }
  });

  it('rounds values to the resolution FIT records them in', async () => {
    const result = await parseFitFile(fixture(), 'run.fit', profile);

    for (const record of result.records) {
      if (record.lat !== undefined) expect(decimals(record.lat)).toBeLessThanOrEqual(7);
      if (record.lng !== undefined) expect(decimals(record.lng)).toBeLessThanOrEqual(7);
      if (record.elevation !== undefined) expect(decimals(record.elevation)).toBeLessThanOrEqual(1);
      if (record.distance !== undefined) expect(decimals(record.distance)).toBeLessThanOrEqual(2);
      if (record.speed !== undefined) expect(decimals(record.speed)).toBeLessThanOrEqual(3);
    }
  });
});
