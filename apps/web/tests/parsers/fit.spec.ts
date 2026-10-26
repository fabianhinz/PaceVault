import { describe, it, expect } from 'vite-plus/test';
import { readE2eFixture } from '@testUtils/fixtures.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import {
  deriveDistanceFromRecords,
  deriveAvgFromRecords,
  deriveMaxFromRecords,
} from '@pacevault/engine/sessionDerivation.ts';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';

describe(deriveDistanceFromRecords.name, () => {
  it('returns undefined for empty array', () => {
    expect(deriveDistanceFromRecords([])).toBeUndefined();
  });

  it('returns last record distance (cumulative)', () => {
    const records = [
      createMockSessionRecord({ distance: 100 }),
      createMockSessionRecord({ distance: 500 }),
      createMockSessionRecord({ distance: 1200 }),
    ];
    expect(deriveDistanceFromRecords(records)).toBe(1200);
  });

  it('skips trailing records with no distance', () => {
    const records = [
      createMockSessionRecord({ distance: 100 }),
      createMockSessionRecord({ distance: 800 }),
      createMockSessionRecord({}),
    ];
    expect(deriveDistanceFromRecords(records)).toBe(800);
  });

  it('returns undefined when no records have distance', () => {
    const records = [createMockSessionRecord({}), createMockSessionRecord({})];
    expect(deriveDistanceFromRecords(records)).toBeUndefined();
  });

  it('keeps a recorded distance of 0', () => {
    const records = [
      createMockSessionRecord({ distance: 500 }),
      createMockSessionRecord({ distance: 0 }),
    ];
    expect(deriveDistanceFromRecords(records)).toBe(0);
  });
});

describe(deriveAvgFromRecords.name, () => {
  it('returns undefined for empty array', () => {
    expect(deriveAvgFromRecords({ records: [], field: 'power' })).toBeUndefined();
  });

  it('returns undefined when no records have the field', () => {
    const records = [createMockSessionRecord({}), createMockSessionRecord({})];
    expect(deriveAvgFromRecords({ records, field: 'power' })).toBeUndefined();
  });

  it('returns the rounded time-weighted mean of power values', () => {
    const records = [
      createMockSessionRecord({ timestamp: 0, power: 200 }),
      createMockSessionRecord({ timestamp: 1, power: 250 }),
      createMockSessionRecord({ timestamp: 2, power: 301 }),
    ];
    expect(deriveAvgFromRecords({ records, field: 'power' })).toBe(276);
  });

  it('counts zero values', () => {
    const records = [
      createMockSessionRecord({ timestamp: 0, power: 200 }),
      createMockSessionRecord({ timestamp: 1, power: 0 }),
      createMockSessionRecord({ timestamp: 2, power: 300 }),
    ];
    expect(deriveAvgFromRecords({ records, field: 'power' })).toBe(150);
  });

  it('returns the rounded time-weighted mean of cadence values', () => {
    const records = [
      createMockSessionRecord({ timestamp: 0, cadence: 80 }),
      createMockSessionRecord({ timestamp: 1, cadence: 85 }),
      createMockSessionRecord({ timestamp: 2, cadence: 82 }),
    ];
    expect(deriveAvgFromRecords({ records, field: 'cadence' })).toBe(84);
  });

  it('average power on smart recording is weighted by time', () => {
    const records = [
      createMockSessionRecord({ timestamp: 0, power: 100 }),
      createMockSessionRecord({ timestamp: 1, power: 100 }),
      createMockSessionRecord({ timestamp: 5, power: 300 }),
    ];
    expect(deriveAvgFromRecords({ records, field: 'power' })).toBe(260);
  });
});

describe(deriveMaxFromRecords.name, () => {
  it('returns undefined for empty array', () => {
    expect(deriveMaxFromRecords({ records: [], field: 'power' })).toBeUndefined();
  });

  it('returns undefined when no records have the field', () => {
    const records = [createMockSessionRecord({}), createMockSessionRecord({})];
    expect(deriveMaxFromRecords({ records, field: 'power' })).toBeUndefined();
  });

  it('returns max power', () => {
    const records = [
      createMockSessionRecord({ power: 200 }),
      createMockSessionRecord({ power: 400 }),
      createMockSessionRecord({ power: 300 }),
    ];
    expect(deriveMaxFromRecords({ records, field: 'power' })).toBe(400);
  });

  it('returns max speed', () => {
    const records = [
      createMockSessionRecord({ speed: 3.0 }),
      createMockSessionRecord({ speed: 4.5 }),
      createMockSessionRecord({ speed: 3.8 }),
    ];
    expect(deriveMaxFromRecords({ records, field: 'speed' })).toBe(4.5);
  });

  it('skips zero values', () => {
    const records = [
      createMockSessionRecord({ power: 0 }),
      createMockSessionRecord({ power: 250 }),
    ];
    expect(deriveMaxFromRecords({ records, field: 'power' })).toBe(250);
  });
});

describe('parseFitFile session name', () => {
  const profile = () => ({ restHr: 48, maxHr: 188, gender: 'male' as const, ftp: 265 });

  it('lets an intervals.icu name win over the filename', async () => {
    const result = await parseFitFile({
      arrayBuffer: readE2eFixture('running.fit'),
      fileName: '15487122967_Lauf_am_Morgen.fit',
      profileAt: profile,
      meta: {
        name: 'Karlsruhe Laufen',
      },
    });
    expect(result.session.name).toBe('Karlsruhe Laufen');
  });
});
