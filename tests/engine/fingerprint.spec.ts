import { v4 } from 'uuid';
import { describe, it, expect } from 'vitest';
import { generateFingerprint, findDuplicates } from '@/lib/fingerprint.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';

// ---------------------------------------------------------------------------
// generateFingerprint
// ---------------------------------------------------------------------------

describe('generateFingerprint', () => {
  const fallback = {
    sport: 'running' as const,
    date: 1700000000000,
    duration: 3600,
    distance: 10000,
  };

  it('uses serial_number + time_created when both are present', () => {
    const fp = generateFingerprint(
      { serial_number: 12345, time_created: '2024-01-15T10:30:00Z' },
      fallback,
    );
    const expectedTs = new Date('2024-01-15T10:30:00Z').getTime();
    expect(fp).toBe(`12345:${expectedTs}`);
  });

  it('handles time_created as a Date object', () => {
    const date = new Date('2024-06-01T08:00:00Z');
    const fp = generateFingerprint({ serial_number: 99, time_created: date }, fallback);
    expect(fp).toBe(`99:${date.getTime()}`);
  });

  it('falls back when serial_number is missing', () => {
    const fp = generateFingerprint({ time_created: '2024-01-15T10:30:00Z' }, fallback);
    expect(fp).toBe('running:1700000000000:3600:10000');
  });

  it('falls back when fileId is undefined', () => {
    const fp = generateFingerprint(undefined, fallback);
    expect(fp).toBe('running:1700000000000:3600:10000');
  });

  it('rounds duration and distance in fallback to avoid float drift', () => {
    const fp = generateFingerprint(undefined, {
      sport: 'cycling',
      date: 1700000000000,
      duration: 3599.7,
      distance: 42195.3,
    });
    expect(fp).toBe('cycling:1700000000000:3600:42195');
  });
});

// ---------------------------------------------------------------------------
// findDuplicates
// ---------------------------------------------------------------------------

const makeSession = (overrides: Partial<TrainingSession> = {}): TrainingSession => ({
  id: v4(),
  sport: 'running',
  date: Date.now(),
  duration: 3600,
  distance: 10000,
  tss: 100,
  stressMethod: 'trimp',
  sensorWarnings: [],
  isPlanned: false,
  hasDetailedRecords: true,
  createdAt: Date.now(),
  source: { kind: 'file' },
  ...overrides,
});

describe('findDuplicates', () => {
  it('returns empty set when no duplicates exist', () => {
    const existing = [makeSession({ fingerprint: 'a' }), makeSession({ fingerprint: 'b' })];
    const result = findDuplicates(['c', 'd'], existing);
    expect(result.size).toBe(0);
  });

  it('detects duplicates against existing sessions', () => {
    const existing = [makeSession({ fingerprint: 'a' }), makeSession({ fingerprint: 'b' })];
    const result = findDuplicates(['a', 'c'], existing);
    expect(result).toEqual(new Set(['a']));
  });

  it('returns all fingerprints when everything is duplicated', () => {
    const existing = [makeSession({ fingerprint: 'x' }), makeSession({ fingerprint: 'y' })];
    const result = findDuplicates(['x', 'y'], existing);
    expect(result).toEqual(new Set(['x', 'y']));
  });

  it('ignores existing sessions without a fingerprint', () => {
    const existing = [makeSession(), makeSession({ fingerprint: 'a' })];
    const result = findDuplicates(['a', 'b'], existing);
    expect(result).toEqual(new Set(['a']));
  });
});
