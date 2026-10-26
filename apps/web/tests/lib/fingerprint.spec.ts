import { describe, it, expect } from 'vite-plus/test';
import { generateFingerprint, findDuplicates } from '@/lib/fingerprint.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';

describe(generateFingerprint.name, () => {
  const fallback = {
    sport: 'running' as const,
    date: 1700000000000,
    duration: 3600,
    distance: 10000,
  };

  it('uses serial_number + time_created when both are present', () => {
    const fp = generateFingerprint({
      fileId: { serial_number: 12345, time_created: '2024-01-15T10:30:00Z' },
      fallback,
    });
    const expectedTs = new Date('2024-01-15T10:30:00Z').getTime();
    expect(fp).toBe(`12345:${expectedTs}`);
  });

  it('handles time_created as a Date object', () => {
    const date = new Date('2024-06-01T08:00:00Z');
    const fp = generateFingerprint({ fileId: { serial_number: 99, time_created: date }, fallback });
    expect(fp).toBe(`99:${date.getTime()}`);
  });

  it('falls back when serial_number is missing', () => {
    const fp = generateFingerprint({ fileId: { time_created: '2024-01-15T10:30:00Z' }, fallback });
    expect(fp).toBe('running:1700000000000:3600:10000');
  });

  it('falls back when fileId is undefined', () => {
    const fp = generateFingerprint({ fileId: undefined, fallback });
    expect(fp).toBe('running:1700000000000:3600:10000');
  });

  it('rounds duration and distance in fallback to avoid float drift', () => {
    const fp = generateFingerprint({
      fileId: undefined,
      fallback: {
        sport: 'cycling',
        date: 1700000000000,
        duration: 3599.7,
        distance: 42195.3,
      },
    });
    expect(fp).toBe('cycling:1700000000000:3600:42195');
  });
});

describe(findDuplicates.name, () => {
  it('returns empty set when no duplicates exist', () => {
    const existing = [
      createMockTrainingSession({ fingerprint: 'a' }),
      createMockTrainingSession({ fingerprint: 'b' }),
    ];
    const result = findDuplicates({ fingerprints: ['c', 'd'], existingSessions: existing });
    expect(result.size).toBe(0);
  });

  it('detects duplicates against existing sessions', () => {
    const existing = [
      createMockTrainingSession({ fingerprint: 'a' }),
      createMockTrainingSession({ fingerprint: 'b' }),
    ];
    const result = findDuplicates({ fingerprints: ['a', 'c'], existingSessions: existing });
    expect(result).toEqual(new Set(['a']));
  });

  it('returns all fingerprints when everything is duplicated', () => {
    const existing = [
      createMockTrainingSession({ fingerprint: 'x' }),
      createMockTrainingSession({ fingerprint: 'y' }),
    ];
    const result = findDuplicates({ fingerprints: ['x', 'y'], existingSessions: existing });
    expect(result).toEqual(new Set(['x', 'y']));
  });

  it('ignores existing sessions without a fingerprint', () => {
    const existing = [createMockTrainingSession(), createMockTrainingSession({ fingerprint: 'a' })];
    const result = findDuplicates({ fingerprints: ['a', 'b'], existingSessions: existing });
    expect(result).toEqual(new Set(['a']));
  });
});
