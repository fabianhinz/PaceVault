import { describe, expect, it } from 'vitest';
import { buildMoreStats, moreStatsTopics } from '@/lib/moreStats.ts';
import type { ResolvedThresholds } from '@/lib/thresholdsAt.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { makeSession } from '../factories/sessions.ts';

const THRESHOLDS: ResolvedThresholds = {
  restHr: 50,
  maxHr: 190,
  ftp: 250,
  weightKg: 70,
  age: 35,
  gender: 'male',
};

const ride = (seconds: number, power: number | undefined): SessionRecord[] =>
  Array.from({ length: seconds + 1 }, (_, i) => ({
    timestamp: i,
    speed: 8,
    distance: i * 8,
    hr: 140,
    power,
    cadence: 90,
  }));

const run = (seconds: number): SessionRecord[] =>
  Array.from({ length: seconds + 1 }, (_, i) => ({
    timestamp: i,
    speed: 3,
    distance: i * 3,
    elevation: 100,
    hr: 150,
    cadence: 85,
    power: 250,
  }));

describe('buildMoreStats', () => {
  it('a ride without FTP has no intensity and peaks without an FTP line', () => {
    const stats = buildMoreStats(makeSession(), ride(1800, 200), { ...THRESHOLDS, ftp: undefined });
    expect(stats.intensity).toBeUndefined();
    expect(stats.peaks?.ftp).toBeUndefined();
  });

  it('a ride without power has no power cells and no Power topic', () => {
    const session = makeSession({ avgPower: undefined, normalizedPower: undefined });
    const stats = buildMoreStats(session, ride(1800, undefined), THRESHOLDS);
    expect(stats.work).toBeUndefined();
    expect(stats.peaks).toBeUndefined();
    expect(stats.coasting).toBeUndefined();
    expect(moreStatsTopics(stats)).not.toContain('power');
  });

  it('a 45 min ride leaves the 60 m peak empty, highlights 20 m and shows no decoupling', () => {
    const stats = buildMoreStats(makeSession(), ride(2700, 200), THRESHOLDS);
    expect(stats.peaks?.slots[4]?.watts).toBeUndefined();
    expect(stats.peaks?.highlight).toBe(3);
    expect(stats.decoupling).toBeUndefined();
  });

  it('a 12 min ride puts value and highlight on the 5 m peak', () => {
    const stats = buildMoreStats(makeSession(), ride(720, 200), THRESHOLDS);
    expect(stats.peaks?.slots[3]?.watts).toBeUndefined();
    expect(stats.peaks?.slots[4]?.watts).toBeUndefined();
    expect(stats.peaks?.highlight).toBe(2);
    expect(stats.peaks?.slots[2]?.watts).toBe(200);
  });

  it('a run shows step length and no Power topic', () => {
    const session = makeSession({
      sport: 'running',
      distance: 5400,
      avgPower: undefined,
      normalizedPower: undefined,
    });
    const stats = buildMoreStats(session, run(1800), THRESHOLDS);
    expect(stats.stepLength?.stepsPerMinute).toBeCloseTo(170, 6);
    expect(stats.stepLength?.metres).toBeCloseTo(3 / (170 / 60), 6);
    expect(stats.stepLength?.paceSecPerKm).toBeCloseTo(1000 / 3, 6);
    expect(moreStatsTopics(stats)).not.toContain('power');
  });

  it('shows no HR zones without a profile', () => {
    expect(buildMoreStats(makeSession(), ride(1800, 200), undefined).hrZones).toBeUndefined();
  });

  it('a ride at 0 W only shows 0 kJ of work and its coasting', () => {
    const session = makeSession({ avgPower: 0, normalizedPower: 0 });
    const stats = buildMoreStats(session, ride(1800, 0), THRESHOLDS);
    expect(stats.work?.kj).toBe(0);
    expect(stats.coasting?.seconds).toBe(1800);
  });

  it('lists the topics in the fixed order', () => {
    const records = ride(3700, 200);
    const stats = buildMoreStats(makeSession(), records, THRESHOLDS);
    expect(moreStatsTopics(stats)).toEqual(['calories', 'power', 'zones', 'decoupling']);
  });
});
