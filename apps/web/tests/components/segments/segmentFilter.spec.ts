import { describe, expect, it } from 'vite-plus/test';
import { segmentsInFilter } from '@/components/segments/segmentFilter.ts';
import { emptyCriteria } from '@/lib/filtering/filters.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockSegment, createMockStoredSegmentPass } from '@tests/factories/segments.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

const NOW = Date.UTC(2026, 1, 11);

const run = createMockSegment({
  id: 'run',
  sport: 'running',
  passes: [
    createMockStoredSegmentPass({ sessionId: 'old-run', date: NOW - 60 * MS_PER_DAY }),
    createMockStoredSegmentPass({ sessionId: 'new-run', date: NOW - 2 * MS_PER_DAY }),
  ],
  lastPassDate: NOW - 2 * MS_PER_DAY,
});
const ride = createMockSegment({
  id: 'ride',
  sport: 'cycling',
  passes: [
    createMockStoredSegmentPass({ sessionId: 'old-ride', date: NOW - 90 * MS_PER_DAY }),
    createMockStoredSegmentPass({ sessionId: 'older-ride', date: NOW - 95 * MS_PER_DAY }),
  ],
  lastPassDate: NOW - 90 * MS_PER_DAY,
});

const sessionsById = new Map(
  [
    createMockTrainingSession({ id: 'old-run', sport: 'running', date: NOW - 60 * MS_PER_DAY }),
    createMockTrainingSession({
      id: 'new-run',
      sport: 'running',
      date: NOW - 2 * MS_PER_DAY,
      elevationGain: 0,
    }),
    createMockTrainingSession({ id: 'old-ride', sport: 'cycling', date: NOW - 90 * MS_PER_DAY }),
    createMockTrainingSession({ id: 'older-ride', sport: 'cycling', date: NOW - 95 * MS_PER_DAY }),
  ].map((session) => [session.id, session]),
);

describe(segmentsInFilter.name, () => {
  it('keeps every segment without a filter', () => {
    expect(
      segmentsInFilter({ segments: [run, ride], sessionsById, criteria: null, now: NOW }),
    ).toEqual([run, ride]);
  });

  it('drops the other sport with a sport filter', () => {
    const criteria = { ...emptyCriteria(), sport: 'running' as const };

    expect(
      segmentsInFilter({ segments: [run, ride], sessionsById, criteria, now: NOW }).map(
        (segment) => segment.id,
      ),
    ).toEqual(['run']);
  });

  it('hides passes outside the time range and drops a segment left without passes', () => {
    const criteria = {
      ...emptyCriteria(),
      time: { kind: 'relative' as const, amount: 30, unit: 'day' as const },
    };
    const visible = segmentsInFilter({ segments: [run, ride], sessionsById, criteria, now: NOW });

    expect(visible.map((segment) => segment.id)).toEqual(['run']);
    expect(visible[0]?.passes.map((pass) => pass.sessionId)).toEqual(['new-run']);
    expect(visible[0]?.lastPassDate).toBe(NOW - 2 * MS_PER_DAY);
  });

  it('keeps a pass whose session recorded 0 m elevation under an elevation filter of 0', () => {
    const criteria = { ...emptyCriteria(), elevationGain: 0 };
    const visible = segmentsInFilter({ segments: [run], sessionsById, criteria, now: NOW });

    expect(visible[0]?.passes.map((pass) => pass.sessionId)).toContain('new-run');
  });
});
