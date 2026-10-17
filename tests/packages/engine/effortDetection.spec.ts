import { describe, expect, it } from 'vitest';
import {
  detectEfforts,
  type EffortBlock,
  type EffortThresholds,
} from '@/packages/engine/effortDetection.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const PROFILE = { ftp: 250, restHr: 50, maxHr: 190, thresholdPace: 255 };
const FULL: EffortThresholds = PROFILE;
const NO_FTP: EffortThresholds = { restHr: 50, maxHr: 190, thresholdPace: 255 };

const rng = (initial: number) => {
  let seed = initial;
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const gauss = (r: () => number) => {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const rideSpeed = (power: number, grade: number) => {
  if (power <= 5) {
    if (grade < -0.005) return Math.min(16, 8 + 250 * -grade);
    return 4;
  }
  let v = 8;
  for (let k = 0; k < 25; k++) {
    const f = 0.192 * v ** 3 + (3.1 + 785 * grade) * v - power;
    const d = 0.576 * v * v + 3.1 + 785 * grade;
    v = clamp(v - f / Math.max(d, 0.5), 1.5, 18);
  }
  return v;
};

interface Segment {
  dur: number;
  kind: string;
  power: (i: number, dur: number) => number;
}

interface RideOptions {
  seed: number;
  segments: Segment[];
  grade?: (i: number) => number;
  tau?: number;
  stop?: (i: number) => boolean;
  smart?: boolean;
  noPower?: boolean;
  noHr?: boolean;
}

/** Synthetic 1 Hz ride, ported from mockups/dynamic-efforts (`finishRide`). */
const ride = (options: RideOptions): SessionRecord[] => {
  const power: number[] = [];
  for (const segment of options.segments) {
    for (let i = 0; i < segment.dur; i++) power.push(Math.max(0, segment.power(i, segment.dur)));
  }
  const r = rng(options.seed + 7);
  const n = power.length;
  const reserve = PROFILE.maxHr - PROFILE.restHr;
  const grade = options.grade ?? (() => 0);
  const stop = options.stop ?? (() => false);
  const tau = options.tau ?? 25;
  const records: SessionRecord[] = [];
  let hr = 95;
  let v = 7;
  let next = 0;
  for (let i = 0; i < n; i++) {
    const p = power[i] ?? 0;
    let target = PROFILE.restHr + reserve * clamp(0.25 + (0.62 * p) / PROFILE.ftp, 0.35, 0.95);
    if (stop(i)) target = PROFILE.restHr + reserve * 0.42;
    let lag = tau * 1.6;
    if (target > hr) lag = tau;
    hr += (target - hr) * (1 - Math.exp(-1 / lag));
    if (stop(i)) v = 0;
    else v += (rideSpeed(p, grade(i)) - v) * 0.12;
    if (options.smart && i < next && i !== n - 1) continue;
    if (options.smart) next = i + 1 + Math.floor(r() * 8);
    let speed = v;
    if (v > 0) speed = v + gauss(r) * 0.08;
    const record: SessionRecord = {
      timestamp: i,
      speed: Math.max(0, Math.round(speed * 100) / 100),
    };
    if (!options.noPower) record.power = Math.round(p);
    if (!options.noHr) record.hr = Math.round(hr + gauss(r) * 0.6);
    records.push(record);
  }
  return records;
};

const intervalSegments = (r: () => number): Segment[] => {
  const segments: Segment[] = [
    { dur: 903, kind: 'warmup', power: (i, d) => 120 + (55 * i) / d + gauss(r) * 15 },
  ];
  for (let k = 0; k < 5; k++) {
    segments.push({
      dur: 240,
      kind: 'work',
      power: (i) => {
        let surge = 0;
        if (i < 4) surge = 90;
        return 300 + surge + 10 * Math.sin(i / 40 + k) + gauss(r) * 18;
      },
    });
    segments.push({
      dur: 180,
      kind: 'rest',
      power: (i) => {
        if (i % 47 > 40) return 0;
        return 120 + gauss(r) * 15;
      },
    });
  }
  segments.push({ dur: 600, kind: 'cooldown', power: () => 125 + gauss(r) * 15 });
  return segments;
};

const intervalRide = (extra: Partial<RideOptions> = {}): SessionRecord[] =>
  ride({
    seed: 11,
    segments: intervalSegments(rng(11)),
    grade: (i) => 0.01 * Math.sin(i / 200),
    ...extra,
  });

const work = (blocks: EffortBlock[]) => blocks.filter((block) => block.kind === 'work');

describe('detectEfforts', () => {
  it('finds 5×4 min power intervals with warm-up and cool-down, edges within 5 s', () => {
    const result = detectEfforts(intervalRide(), 'cycling', FULL);

    expect(result.signal).toBe('power');
    expect(result.limitedBy).toBeUndefined();
    const efforts = work(result.blocks);
    expect(efforts).toHaveLength(5);
    efforts.forEach((block, k) => {
      expect(Math.abs(block.start - (903 + k * 420))).toBeLessThanOrEqual(5);
      expect(Math.abs(block.end - (1143 + k * 420))).toBeLessThanOrEqual(5);
    });
    expect(result.blocks[0]?.kind).toBe('warmup');
    expect(result.blocks[result.blocks.length - 1]?.kind).toBe('cooldown');
  });

  it('finds nothing on a 3 h endurance ride over rolling hills with coasting at 0 W', () => {
    const r = rng(21);
    const grade = (i: number) =>
      0.035 * Math.sin((2 * Math.PI * i) / 900) +
      0.015 * Math.sin((2 * Math.PI * i) / 370 + 1) +
      0.008 * Math.sin((2 * Math.PI * i) / 2400);
    const records = ride({
      seed: 21,
      grade,
      segments: [
        {
          dur: 10_800,
          kind: 'steady',
          power: (i) => {
            const g = grade(i);
            if (g < -0.025) return 0;
            return Math.min(205, Math.max(70, 172 + 900 * g)) + gauss(r) * 22;
          },
        },
      ],
    });

    expect(detectEfforts(records, 'cycling', FULL).blocks).toEqual([]);
  });

  it('finds nothing on a 60 min time trial at ~0.98 FTP (work share guard)', () => {
    const r = rng(51);
    const records = ride({
      seed: 51,
      grade: (i) => 0.012 * Math.sin(i / 400),
      segments: [
        { dur: 360, kind: 'warmup', power: (i, d) => 140 + (70 * i) / d + gauss(r) * 15 },
        {
          dur: 3600,
          kind: 'work',
          power: (i) => {
            if ([900, 2100, 3300].some((s) => i >= s && i < s + 30)) return 380 + gauss(r) * 20;
            return 245 + 10 * Math.sin(i / 300) + gauss(r) * 20;
          },
        },
        { dur: 120, kind: 'cooldown', power: () => 110 + gauss(r) * 12 },
      ],
    });

    expect(detectEfforts(records, 'cycling', FULL).blocks).toEqual([]);
  });

  const trafficRide = (stopSeconds: number): SessionRecord[] => {
    const r = rng(61);
    const stopFrom = 600 + 480 + 240 + 210;
    const steadyWork = () => 280 + gauss(r) * 18;
    return ride({
      seed: 61,
      smart: true,
      grade: (i) => 0.006 * Math.sin(i / 120),
      stop: (i) => i >= stopFrom && i < stopFrom + stopSeconds,
      segments: [
        { dur: 600, kind: 'warmup', power: () => 150 + gauss(r) * 15 },
        { dur: 480, kind: 'work', power: steadyWork },
        { dur: 240, kind: 'rest', power: () => 130 + gauss(r) * 15 },
        {
          dur: 480,
          kind: 'work',
          power: (i) => {
            if (i >= 210 && i < 210 + stopSeconds) return 0;
            return steadyWork();
          },
        },
        { dur: 240, kind: 'rest', power: () => 130 + gauss(r) * 15 },
        { dur: 480, kind: 'work', power: steadyWork },
        { dur: 480, kind: 'cooldown', power: () => 120 + gauss(r) * 15 },
      ],
    });
  };

  it('bridges a 2:00 traffic-light stop inside a work block (smart recording)', () => {
    const efforts = work(detectEfforts(trafficRide(120), 'cycling', FULL).blocks);

    expect(efforts).toHaveLength(3);
    const bridged = efforts[1];
    if (!bridged) throw new Error('missing bridged block');
    expect(Math.abs(bridged.start - 1320)).toBeLessThanOrEqual(10);
    expect(Math.abs(bridged.end - 1800)).toBeLessThanOrEqual(10);
    expect(Math.abs(bridged.movingTime - (bridged.end - bridged.start - 120))).toBeLessThanOrEqual(
      5,
    );
  });

  it('splits a work block at a 2:30 stop', () => {
    const efforts = work(detectEfforts(trafficRide(150), 'cycling', FULL).blocks);

    expect(efforts).toHaveLength(4);
    expect(efforts.some((block) => block.start < 1530 && block.end > 1680)).toBe(false);
  });

  it('detects HR-only intervals with the 30 s lag shifted out', () => {
    const r = rng(41);
    const segments: Segment[] = [
      { dur: 720, kind: 'warmup', power: (i, d) => 130 + (30 * i) / d + gauss(r) * 15 },
    ];
    for (let k = 0; k < 6; k++) {
      segments.push({ dur: 180, kind: 'work', power: () => 290 + gauss(r) * 18 });
      segments.push({ dur: 180, kind: 'rest', power: () => 120 + gauss(r) * 15 });
    }
    segments.push({ dur: 480, kind: 'cooldown', power: () => 120 + gauss(r) * 15 });
    const records = ride({
      seed: 41,
      segments,
      tau: 30,
      noPower: true,
      grade: (i) => 0.008 * Math.sin(i / 150),
    });

    const result = detectEfforts(records, 'cycling', FULL);

    expect(result.signal).toBe('hr');
    const efforts = work(result.blocks);
    expect(efforts).toHaveLength(6);
    efforts.forEach((block, k) => {
      expect(Math.abs(block.start - (720 + k * 360))).toBeLessThanOrEqual(20);
    });
  });

  it('falls back to HR without FTP and reports the missing FTP', () => {
    const result = detectEfforts(intervalRide(), 'cycling', NO_FTP);

    expect(result.signal).toBe('hr');
    expect(result.limitedBy).toBe('ftp');
    expect(work(result.blocks).length).toBeGreaterThanOrEqual(2);
  });

  it('finds nothing on a power-only ride without FTP but still reports the missing FTP', () => {
    const result = detectEfforts(intervalRide({ noHr: true }), 'cycling', NO_FTP);

    expect(result).toEqual({ blocks: [], signal: null, limitedBy: 'ftp' });
  });
});
