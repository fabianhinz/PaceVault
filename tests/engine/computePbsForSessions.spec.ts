import { describe, it, expect } from 'vitest';
import { computePBsForSessions } from '@/lib/records.ts';
import { makeCyclingRecords, makeRunningRecords } from '../factories/records.ts';
import type { PersonalBest } from '@/packages/engine/types.ts';

const DAY_MS = 24 * 60 * 60 * 1000;
const POWER_WINDOWS = [5, 60, 300, 1200, 3600];

const makePowerBests = (value: number, date: number): PersonalBest[] =>
  POWER_WINDOWS.map((window) => ({
    sport: 'cycling',
    category: 'peak-power',
    window,
    value,
    sessionId: 'existing',
    date,
  }));

describe('computePBsForSessions', () => {
  it('returns best values from the stronger cycling session', () => {
    const now = Date.now();
    const weakRecords = makeCyclingRecords(3600, { basePower: 200 });
    const strongRecords = makeCyclingRecords(3600, {
      basePower: 280,
    });

    const result = computePBsForSessions([
      {
        sessionId: 'weak',
        date: now - 2 * DAY_MS,
        sport: 'cycling',
        records: weakRecords,
      },
      {
        sessionId: 'strong',
        date: now - DAY_MS,
        sport: 'cycling',
        records: strongRecords,
      },
    ]);

    const powerPBs = result.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.length).toBe(5);
    expect(powerPBs.every((pb) => pb.sessionId === 'strong')).toBe(true);
    expect(powerPBs.every((pb) => pb.sport === 'cycling')).toBe(true);
  });

  it('returns empty array for empty input', () => {
    expect(computePBsForSessions([])).toEqual([]);
  });

  it('handles sessions with no records gracefully', () => {
    const result = computePBsForSessions([
      {
        sessionId: 'empty',
        date: Date.now(),
        sport: 'cycling',
        records: [],
      },
    ]);

    expect(result).toEqual([]);
  });

  it("keeps each sport's peaks separate in mixed-sport batch", () => {
    const now = Date.now();
    const cyclingRecords = makeCyclingRecords(3600, { basePower: 250 });
    const runningRecords = makeRunningRecords(3600, { baseSpeed: 3.5 });

    const result = computePBsForSessions([
      {
        sessionId: 'c1',
        date: now,
        sport: 'cycling',
        records: cyclingRecords,
      },
      {
        sessionId: 'r1',
        date: now,
        sport: 'running',
        records: runningRecords,
      },
    ]);

    const cyclingPBs = result.filter((pb) => pb.sport === 'cycling');
    const runningPBs = result.filter((pb) => pb.sport === 'running');

    expect(cyclingPBs.length).toBeGreaterThanOrEqual(5);
    expect(runningPBs.length).toBeGreaterThanOrEqual(1);
    expect(cyclingPBs.filter((pb) => pb.category === 'peak-power').length).toBe(5);
    expect(runningPBs.every((pb) => pb.category === 'fastest-distance')).toBe(true);
  });

  it('lower power does NOT overwrite higher power (higher is better for cycling)', () => {
    const now = Date.now();
    const strongRecords = makeCyclingRecords(3600, {
      basePower: 300,
    });
    const weakRecords = makeCyclingRecords(3600, { basePower: 180 });

    const result = computePBsForSessions([
      {
        sessionId: 'strong',
        date: now - DAY_MS,
        sport: 'cycling',
        records: strongRecords,
      },
      {
        sessionId: 'weak',
        date: now,
        sport: 'cycling',
        records: weakRecords,
      },
    ]);

    const powerPBs = result.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.every((pb) => pb.sessionId === 'strong')).toBe(true);
  });

  it('slower run does NOT overwrite faster run (lower time is better)', () => {
    const now = Date.now();
    const fastRecords = makeRunningRecords(3600, { baseSpeed: 4.5 });
    const slowRecords = makeRunningRecords(3600, { baseSpeed: 2.5 });

    const result = computePBsForSessions([
      {
        sessionId: 'fast',
        date: now - DAY_MS,
        sport: 'running',
        records: fastRecords,
      },
      {
        sessionId: 'slow',
        date: now,
        sport: 'running',
        records: slowRecords,
      },
    ]);

    const distancePBs = result.filter((pb) => pb.category === 'fastest-distance');
    expect(distancePBs.every((pb) => pb.sessionId === 'fast')).toBe(true);
  });

  it('tracks longest distance per sport', () => {
    const now = Date.now();
    const records = makeCyclingRecords(100, { basePower: 200 });

    const result = computePBsForSessions([
      {
        sessionId: 'c1',
        date: now,
        sport: 'cycling',
        records,
        distance: 80000,
        elevationGain: 1200,
      },
    ]);

    const longest = result.find((pb) => pb.category === 'longest');
    const elevation = result.find((pb) => pb.category === 'most-elevation');

    expect(longest).toBeDefined();
    expect(longest?.value).toBe(80000);
    expect(elevation).toBeDefined();
    expect(elevation?.value).toBe(1200);
  });

  it('picks best session-level records across multiple sessions', () => {
    const now = Date.now();

    const result = computePBsForSessions([
      {
        sessionId: 'short',
        date: now - DAY_MS,
        sport: 'running',
        records: makeRunningRecords(100),
        distance: 5000,
      },
      {
        sessionId: 'long',
        date: now,
        sport: 'running',
        records: makeRunningRecords(100),
        distance: 21000,
      },
    ]);

    const longest = result.find((pb) => pb.category === 'longest' && pb.sport === 'running');
    expect(longest).toBeDefined();
    expect(longest?.sessionId).toBe('long');
    expect(longest?.value).toBe(21000);
  });

  it('finds distance PBs for a running session', () => {
    const result = computePBsForSessions([
      {
        sessionId: 'r1',
        date: Date.now(),
        sport: 'running',
        records: makeRunningRecords(3600, { baseSpeed: 3.5 }),
      },
    ]);

    const distancePBs = result.filter((pb) => pb.category === 'fastest-distance');
    expect(distancePBs.length).toBeGreaterThanOrEqual(2);
  });

  it('gives running no elevation PB', () => {
    const result = computePBsForSessions([
      {
        sessionId: 'r1',
        date: Date.now(),
        sport: 'running',
        records: makeRunningRecords(100),
        distance: 10000,
        elevationGain: 500,
      },
    ]);

    expect(result.find((pb) => pb.category === 'most-elevation')).toBeUndefined();
  });

  describe('with existing PBs', () => {
    const cyclingSession = (sessionId: string, basePower: number) => ({
      sessionId,
      date: Date.now(),
      sport: 'cycling' as const,
      records: makeCyclingRecords(3600, { basePower }),
    });

    it('replaces the PBs a new session beats', () => {
      const result = computePBsForSessions(
        [cyclingSession('new', 280)],
        makePowerBests(100, Date.now() - 10 * DAY_MS),
      );

      const powerPBs = result.filter((pb) => pb.category === 'peak-power');
      expect(powerPBs).toHaveLength(5);
      expect(powerPBs.every((pb) => pb.sessionId === 'new')).toBe(true);
    });

    it('keeps the PBs a new session does not beat, however old they are', () => {
      const result = computePBsForSessions(
        [cyclingSession('new', 200)],
        makePowerBests(500, Date.now() - 400 * DAY_MS),
      );

      const powerPBs = result.filter((pb) => pb.category === 'peak-power');
      expect(powerPBs.every((pb) => pb.sessionId === 'existing')).toBe(true);
    });

    it('keeps PBs of other sports and categories', () => {
      const runningPB: PersonalBest = {
        sport: 'running',
        category: 'fastest-distance',
        window: 1000,
        value: 240,
        sessionId: 'run',
        date: Date.now(),
      };

      const result = computePBsForSessions([cyclingSession('new', 250)], [runningPB]);

      expect(result).toContainEqual(runningPB);
    });

    it('gives the same result as computing all sessions at once', () => {
      const sessions = [
        cyclingSession('a', 180),
        cyclingSession('b', 260),
        cyclingSession('c', 220),
      ];

      const incremental = sessions.reduce<PersonalBest[]>(
        (pbs, session) => computePBsForSessions([session], pbs),
        [],
      );

      expect(incremental).toEqual(computePBsForSessions(sessions));
    });

    it('does not mutate the existing PBs', () => {
      const existing = makePowerBests(100, Date.now());
      const copy = structuredClone(existing);

      computePBsForSessions([cyclingSession('new', 280)], existing);

      expect(existing).toEqual(copy);
    });
  });
});
