import { describe, it, expect } from 'vite-plus/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseFitFile } from '@/parsers/fit.ts';
import {
  deriveDistanceFromRecords,
  deriveAvgFromRecords,
  deriveMaxFromRecords,
} from '@pacevault/engine/sessionDerivation.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';

const makeRecord = (overrides: Partial<SessionRecord> = {}): SessionRecord => {
  return { timestamp: 0, ...overrides };
};

describe('deriveDistanceFromRecords', () => {
  it('returns undefined for empty array', () => {
    expect(deriveDistanceFromRecords([])).toBeUndefined();
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

  it('returns undefined when no records have distance', () => {
    const records = [makeRecord({}), makeRecord({})];
    expect(deriveDistanceFromRecords(records)).toBeUndefined();
  });

  it('keeps a recorded distance of 0', () => {
    const records = [makeRecord({ distance: 500 }), makeRecord({ distance: 0 })];
    expect(deriveDistanceFromRecords(records)).toBe(0);
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

  it('returns the rounded time-weighted mean of power values', () => {
    const records = [
      makeRecord({ timestamp: 0, power: 200 }),
      makeRecord({ timestamp: 1, power: 250 }),
      makeRecord({ timestamp: 2, power: 301 }),
    ];
    expect(deriveAvgFromRecords(records, 'power')).toBe(276);
  });

  it('counts zero values', () => {
    const records = [
      makeRecord({ timestamp: 0, power: 200 }),
      makeRecord({ timestamp: 1, power: 0 }),
      makeRecord({ timestamp: 2, power: 300 }),
    ];
    expect(deriveAvgFromRecords(records, 'power')).toBe(150);
  });

  it('returns the rounded time-weighted mean of cadence values', () => {
    const records = [
      makeRecord({ timestamp: 0, cadence: 80 }),
      makeRecord({ timestamp: 1, cadence: 85 }),
      makeRecord({ timestamp: 2, cadence: 82 }),
    ];
    expect(deriveAvgFromRecords(records, 'cadence')).toBe(84);
  });

  it('average power on smart recording is weighted by time', () => {
    const records = [
      makeRecord({ timestamp: 0, power: 100 }),
      makeRecord({ timestamp: 1, power: 100 }),
      makeRecord({ timestamp: 5, power: 300 }),
    ];
    expect(deriveAvgFromRecords(records, 'power')).toBe(260);
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
    const buf = readFileSync(resolve(import.meta.dirname, '../../e2e/fixtures/running.fit'));
    const bytes = new Uint8Array(buf.byteLength);
    bytes.set(buf);
    return bytes.buffer;
  };

  const profile = () => ({ restHr: 48, maxHr: 188, gender: 'male' as const, ftp: 265 });

  it('lets an intervals.icu name win over the filename', async () => {
    const result = await parseFitFile(fixture(), '15487122967_Lauf_am_Morgen.fit', profile, {
      name: 'Karlsruhe Laufen',
    });
    expect(result.session.name).toBe('Karlsruhe Laufen');
  });
});
