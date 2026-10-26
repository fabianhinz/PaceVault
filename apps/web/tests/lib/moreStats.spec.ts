import { describe, expect, it } from 'vite-plus/test';
import { buildMoreStats, moreStatsTopics, peakScale, pickPeak, pickZone } from '@/lib/moreStats.ts';
import type { ResolvedThresholds } from '@/lib/thresholdsAt.ts';
import type { SessionRecord } from '@pacevault/engine/types.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';

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

describe(buildMoreStats.name, () => {
  it('a ride with FTP feeds the IF meter with NP / FTP next to its VI', () => {
    const stats = buildMoreStats({
      session: createMockTrainingSession(),
      records: ride(1800, 200),
      thresholds: THRESHOLDS,
    });
    expect(stats.intensity?.factor).toBeCloseTo(215 / 250, 6);
    expect(stats.variability?.index).toBeCloseTo(215 / 200, 6);
  });

  it('a ride without FTP keeps VI and its peaks but has no IF', () => {
    const stats = buildMoreStats({
      session: createMockTrainingSession(),
      records: ride(1800, 200),
      thresholds: {
        ...THRESHOLDS,
        ftp: undefined,
      },
    });
    expect(stats.intensity).toBeUndefined();
    expect(stats.variability?.index).toBeCloseTo(215 / 200, 6);
    expect(stats.peaks?.slots[0]?.watts).toBe(200);
  });

  it('a ride without power has no power cells and no Power topic', () => {
    const session = createMockTrainingSession({ avgPower: undefined, normalizedPower: undefined });
    const stats = buildMoreStats({
      session,
      records: ride(1800, undefined),
      thresholds: THRESHOLDS,
    });
    expect(stats.peaks).toBeUndefined();
    expect(moreStatsTopics(stats)).not.toContain('power');
  });

  it('a 45 min ride leaves the 60 m peak empty, highlights 20 m and shows no decoupling', () => {
    const stats = buildMoreStats({
      session: createMockTrainingSession(),
      records: ride(2700, 200),
      thresholds: THRESHOLDS,
    });
    expect(stats.peaks?.slots[4]?.watts).toBeUndefined();
    expect(stats.peaks?.highlight).toBe(3);
    expect(stats.decoupling).toBeUndefined();
  });

  it('a 12 min ride puts value and highlight on the 5 m peak', () => {
    const stats = buildMoreStats({
      session: createMockTrainingSession(),
      records: ride(720, 200),
      thresholds: THRESHOLDS,
    });
    expect(stats.peaks?.slots[3]?.watts).toBeUndefined();
    expect(stats.peaks?.slots[4]?.watts).toBeUndefined();
    expect(stats.peaks?.highlight).toBe(2);
    expect(stats.peaks?.slots[2]?.watts).toBe(200);
  });

  it('a run shows step length, no coasting and no Power topic', () => {
    const session = createMockTrainingSession({
      sport: 'running',
      distance: 5400,
      avgPower: undefined,
      normalizedPower: undefined,
    });
    const stats = buildMoreStats({ session, records: run(1800), thresholds: THRESHOLDS });
    expect(stats.stepLength?.stepsPerMinute).toBeCloseTo(170, 6);
    expect(stats.stepLength?.metres).toBeCloseTo(3 / (170 / 60), 6);
    expect(stats.movingTime?.coastingS).toBeUndefined();
    expect(moreStatsTopics(stats)).not.toContain('power');
  });

  it('shows no HR zones without a profile', () => {
    expect(
      buildMoreStats({
        session: createMockTrainingSession(),
        records: ride(1800, 200),
        thresholds: undefined,
      }).hrZones,
    ).toBeUndefined();
  });

  it('a ride at 0 W keeps 0 W peaks and counts all its moving time as coasting', () => {
    const session = createMockTrainingSession({ avgPower: 0, normalizedPower: 0 });
    const stats = buildMoreStats({ session, records: ride(1800, 0), thresholds: THRESHOLDS });
    expect(stats.peaks?.slots[0]?.watts).toBe(0);
    expect(stats.movingTime?.coastingS).toBe(1800);
  });

  it('lists the topics in the fixed order with load first', () => {
    const records = ride(3700, 200);
    const stats = buildMoreStats({
      session: createMockTrainingSession(),
      records,
      thresholds: THRESHOLDS,
    });
    expect(moreStatsTopics(stats)).toEqual(['load', 'calories', 'power', 'zones']);
  });
});

describe(peakScale.name, () => {
  it('puts the best bar at full height on a log scale and keeps 0 W and missing apart', () => {
    const heights = peakScale({ watts: [800, 400, 200, 0, undefined], heightPx: 24 });
    expect(heights[0]).toBe(24);
    expect(heights[1]).toBeCloseTo(16, 6);
    expect(heights[2]).toBeCloseTo(8, 6);
    expect(heights[3]).toBe(0);
    expect(heights[4]).toBeUndefined();
  });
});

describe(pickPeak.name, () => {
  const built = buildMoreStats({
    session: createMockTrainingSession(),
    records: ride(2700, 200),
    thresholds: THRESHOLDS,
  }).peaks;
  if (!built) throw new Error('expected peaks');
  const peaks = built;

  it('rests on the highlighted 20 m peak', () => {
    expect(pickPeak({ peaks, hovered: null })).toEqual({
      index: 3,
      active: false,
      seconds: 1200,
      watts: 200,
    });
  });

  it('switches to the hovered window', () => {
    expect(pickPeak({ peaks, hovered: 1 })).toEqual({
      index: 1,
      active: true,
      seconds: 60,
      watts: 200,
    });
  });

  it('stays at rest over a window the ride is too short for', () => {
    expect(pickPeak({ peaks, hovered: 4 })?.index).toBe(3);
    expect(pickPeak({ peaks, hovered: 4 })?.active).toBe(false);
  });
});

describe(pickZone.name, () => {
  const built = buildMoreStats({
    session: createMockTrainingSession(),
    records: ride(1800, 200),
    thresholds: THRESHOLDS,
  }).hrZones;
  if (!built) throw new Error('expected HR zones');
  const zones = built;

  it('rests on the dominant zone with its share', () => {
    const pick = pickZone({ zones, hovered: null });
    expect(pick?.index).toBe(zones.dominant);
    expect(pick?.active).toBe(false);
    expect(pick?.share).toBe(1);
  });

  it('switches to the hovered zone, even an empty one', () => {
    const empty = zones.dominant === 0 ? 4 : 0;
    const pick = pickZone({ zones, hovered: empty });
    expect(pick?.active).toBe(true);
    expect(pick?.zone.seconds).toBe(0);
    expect(pick?.share).toBe(0);
  });
});
