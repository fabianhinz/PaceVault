import { describe, it, expect } from 'vitest';
import { computePBsForSessions } from '@/lib/records.ts';
import { makeCyclingRecords, makeRunningRecords } from '../factories/records.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('computePBsForSessions', () => {
  it('returns best values from the stronger cycling session', () => {
    const now = Date.now();
    const weakRecords = makeCyclingRecords('weak', 3600, { basePower: 200 });
    const strongRecords = makeCyclingRecords('strong', 3600, {
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
    expect(powerPBs.length).toBe(5); // 5s, 1min, 5min, 20min, 60min
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
    const cyclingRecords = makeCyclingRecords('c1', 3600, { basePower: 250 });
    const runningRecords = makeRunningRecords('r1', 3600, { baseSpeed: 3.5 });

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

    expect(cyclingPBs.length).toBeGreaterThanOrEqual(5); // 5 power windows
    expect(runningPBs.length).toBeGreaterThanOrEqual(1); // at least some distance PBs
    expect(cyclingPBs.filter((pb) => pb.category === 'peak-power').length).toBe(5);
    expect(runningPBs.every((pb) => pb.category === 'fastest-distance')).toBe(true);
  });

  it('lower power does NOT overwrite higher power (higher is better for cycling)', () => {
    const now = Date.now();
    const strongRecords = makeCyclingRecords('strong', 3600, {
      basePower: 300,
    });
    const weakRecords = makeCyclingRecords('weak', 3600, { basePower: 180 });

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
    const fastRecords = makeRunningRecords('fast', 3600, { baseSpeed: 4.5 });
    const slowRecords = makeRunningRecords('slow', 3600, { baseSpeed: 2.5 });

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
    const records = makeCyclingRecords('c1', 100, { basePower: 200 });

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
        records: makeRunningRecords('short', 100),
        distance: 5000,
      },
      {
        sessionId: 'long',
        date: now,
        sport: 'running',
        records: makeRunningRecords('long', 100),
        distance: 21000,
      },
    ]);

    const longest = result.find((pb) => pb.category === 'longest' && pb.sport === 'running');
    expect(longest).toBeDefined();
    expect(longest?.sessionId).toBe('long');
    expect(longest?.value).toBe(21000);
  });
});
