import { describe, it, expect } from 'vite-plus/test';
import { createMockSessionRecord } from '@pacevault/testing/records.ts';
import { computePBsForSessions } from '@/lib/analysis/records.ts';
import { cyclingRecordSeries, runningRecordSeries } from '@pacevault/testing/series.ts';
import type { PersonalBest } from '@pacevault/engine/types.ts';
import { createMockPersonalBest } from '@pacevault/testing/personalBests.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

const POWER_WINDOWS = [5, 60, 300, 1200, 3600];

const powerBestsAt = (value: number, date: number): PersonalBest[] =>
  POWER_WINDOWS.map((window) =>
    createMockPersonalBest({ window, value, sessionId: 'existing', date }),
  );

describe(computePBsForSessions.name, () => {
  it('returns best values from the stronger cycling session', () => {
    const now = Date.now();
    const weakRecords = cyclingRecordSeries({ count: 3601, basePowerWatts: 200 });
    const strongRecords = cyclingRecordSeries({ count: 3601, basePowerWatts: 280 });

    const result = computePBsForSessions({
      sessions: [
        {
          sessionId: 'weak',
          date: now - 2 * MS_PER_DAY,
          sport: 'cycling',
          records: weakRecords,
        },
        {
          sessionId: 'strong',
          date: now - MS_PER_DAY,
          sport: 'cycling',
          records: strongRecords,
        },
      ],
    });

    const powerPBs = result.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs).toHaveLength(5);
    expect(powerPBs.filter((pb) => !(pb.sessionId === 'strong'))).toEqual([]);
    expect(powerPBs.filter((pb) => !(pb.sport === 'cycling'))).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(computePBsForSessions({ sessions: [] })).toEqual([]);
  });

  it('handles sessions with no records gracefully', () => {
    const result = computePBsForSessions({
      sessions: [
        {
          sessionId: 'empty',
          date: Date.now(),
          sport: 'cycling',
          records: [],
        },
      ],
    });

    expect(result).toEqual([]);
  });

  it("keeps each sport's peaks separate in mixed-sport batch", () => {
    const now = Date.now();
    const cyclingRecords = cyclingRecordSeries({ count: 3601, basePowerWatts: 250 });
    const runningRecords = runningRecordSeries({ count: 3600, baseSpeedMetersPerSec: 3.5 });

    const result = computePBsForSessions({
      sessions: [
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
      ],
    });

    const cyclingPBs = result.filter((pb) => pb.sport === 'cycling');
    const runningPBs = result.filter((pb) => pb.sport === 'running');

    expect(cyclingPBs.length).toBeGreaterThanOrEqual(5);
    expect(runningPBs.length).toBeGreaterThanOrEqual(1);
    expect(cyclingPBs.filter((pb) => pb.category === 'peak-power').length).toBe(5);
    expect(runningPBs.filter((pb) => !(pb.category === 'fastest-distance'))).toEqual([]);
  });

  it('lower power does NOT overwrite higher power (higher is better for cycling)', () => {
    const now = Date.now();
    const strongRecords = cyclingRecordSeries({ count: 3601, basePowerWatts: 300 });
    const weakRecords = cyclingRecordSeries({ count: 3601, basePowerWatts: 180 });

    const result = computePBsForSessions({
      sessions: [
        {
          sessionId: 'strong',
          date: now - MS_PER_DAY,
          sport: 'cycling',
          records: strongRecords,
        },
        {
          sessionId: 'weak',
          date: now,
          sport: 'cycling',
          records: weakRecords,
        },
      ],
    });

    const powerPBs = result.filter((pb) => pb.category === 'peak-power');
    expect(powerPBs.filter((pb) => !(pb.sessionId === 'strong'))).toEqual([]);
  });

  it('slower run does NOT overwrite faster run (lower time is better)', () => {
    const now = Date.now();
    const fastRecords = runningRecordSeries({ count: 3600, baseSpeedMetersPerSec: 4.5 });
    const slowRecords = runningRecordSeries({ count: 3600, baseSpeedMetersPerSec: 2.5 });

    const result = computePBsForSessions({
      sessions: [
        {
          sessionId: 'fast',
          date: now - MS_PER_DAY,
          sport: 'running',
          records: fastRecords,
        },
        {
          sessionId: 'slow',
          date: now,
          sport: 'running',
          records: slowRecords,
        },
      ],
    });

    const distancePBs = result.filter((pb) => pb.category === 'fastest-distance');
    expect(distancePBs.filter((pb) => !(pb.sessionId === 'fast'))).toEqual([]);
  });

  it('tracks longest distance per sport', () => {
    const now = Date.now();
    const records = cyclingRecordSeries({ count: 100, basePowerWatts: 200 });

    const result = computePBsForSessions({
      sessions: [
        {
          sessionId: 'c1',
          date: now,
          sport: 'cycling',
          records,
          distance: 80000,
          elevationGain: 1200,
        },
      ],
    });

    const longest = result.find((pb) => pb.category === 'longest');
    const elevation = result.find((pb) => pb.category === 'most-elevation');

    expect(longest).toBeDefined();
    expect(longest?.value).toBe(80000);
    expect(elevation).toBeDefined();
    expect(elevation?.value).toBe(1200);
  });

  it('picks best session-level records across multiple sessions', () => {
    const now = Date.now();

    const result = computePBsForSessions({
      sessions: [
        {
          sessionId: 'short',
          date: now - MS_PER_DAY,
          sport: 'running',
          records: runningRecordSeries({ count: 100 }),
          distance: 5000,
        },
        {
          sessionId: 'long',
          date: now,
          sport: 'running',
          records: runningRecordSeries({ count: 100 }),
          distance: 21000,
        },
      ],
    });

    const longest = result.find((pb) => pb.category === 'longest' && pb.sport === 'running');
    expect(longest).toBeDefined();
    expect(longest?.sessionId).toBe('long');
    expect(longest?.value).toBe(21000);
  });

  it('finds distance PBs for a running session', () => {
    const result = computePBsForSessions({
      sessions: [
        {
          sessionId: 'r1',
          date: Date.now(),
          sport: 'running',
          records: runningRecordSeries({ count: 3600, baseSpeedMetersPerSec: 3.5 }),
        },
      ],
    });

    const distancePBs = result.filter((pb) => pb.category === 'fastest-distance');
    expect(distancePBs.length).toBeGreaterThanOrEqual(2);
  });

  describe('with existing PBs', () => {
    const cyclingSession = (sessionId: string, basePowerWatts: number) => ({
      sessionId,
      date: Date.now(),
      sport: 'cycling' as const,
      records: cyclingRecordSeries({ count: 3601, basePowerWatts }),
    });

    it('replaces the PBs a new session beats', () => {
      const result = computePBsForSessions({
        sessions: [cyclingSession('new', 280)],
        existing: powerBestsAt(100, Date.now() - 10 * MS_PER_DAY),
      });

      const powerPBs = result.filter((pb) => pb.category === 'peak-power');
      expect(powerPBs).toHaveLength(5);
      expect(powerPBs.filter((pb) => !(pb.sessionId === 'new'))).toEqual([]);
    });

    it('gives the same result as computing all sessions at once', () => {
      const sessions = [
        cyclingSession('a', 180),
        cyclingSession('b', 260),
        cyclingSession('c', 220),
      ];

      const incremental = sessions.reduce<PersonalBest[]>(
        (pbs, session) => computePBsForSessions({ sessions: [session], existing: pbs }),
        [],
      );

      expect(incremental).toEqual(computePBsForSessions({ sessions }));
    });
  });
});

describe('computePBsForSessions with recorded zeros', () => {
  it('keeps zero-power seconds in the peak windows', () => {
    const records = Array.from({ length: 120 }, (_, i) => ({
      timestamp: i,
      power: i % 2 === 0 ? 0 : 400,
    }));
    const result = computePBsForSessions({
      sessions: [{ sessionId: 's', date: 0, sport: 'cycling', records }],
    });
    const peak60 = result.find((pb) => pb.category === 'peak-power' && pb.window === 60);
    expect(peak60?.value).toBe(200);
  });
});

describe('computePBsForSessions on smart recording', () => {
  it('peak windows on smart recording count seconds, not samples', () => {
    const records = Array.from({ length: 151 }, (_, i) =>
      createMockSessionRecord({ timestamp: i * 4, power: 250 }),
    );
    const result = computePBsForSessions({
      sessions: [{ sessionId: 's', date: 0, sport: 'cycling', records }],
    });
    const peak = (window: number) =>
      result.find((pb) => pb.category === 'peak-power' && pb.window === window);
    expect(peak(300)?.value).toBe(250);
    expect(peak(1200)).toBeUndefined();
  });

  it('gives no personal best for a ride with only 0 W', () => {
    const records = Array.from({ length: 120 }, (_, i) =>
      createMockSessionRecord({ timestamp: i, power: 0 }),
    );
    const result = computePBsForSessions({
      sessions: [{ sessionId: 's', date: 0, sport: 'cycling', records }],
    });
    expect(result.filter((pb) => pb.category === 'peak-power')).toEqual([]);
  });
});
