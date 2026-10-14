import { describe, expect, it } from 'vitest';
import { climbingRate, detectClimbs } from '@/packages/engine/climbs.ts';
import { windowedGradients } from '@/packages/engine/gradient.ts';
import type { SessionRecord, Sport } from '@/packages/engine/types.ts';

interface Stretch {
  metres: number;
  gradient: number;
  speed?: number;
}

const ride = (stretches: Stretch[], speed = 1): SessionRecord[] => {
  const records: SessionRecord[] = [{ timestamp: 0, speed, distance: 0, elevation: 100 }];
  let distance = 0;
  let elevation = 100;
  let timestamp = 0;
  for (const stretch of stretches) {
    const v = stretch.speed ?? speed;
    for (let covered = 0; covered < stretch.metres; covered += v) {
      timestamp += 1;
      distance += v;
      elevation += v * stretch.gradient;
      records.push({ timestamp, speed: v, distance, elevation });
    }
  }
  return records;
};

const climbsOf = (sport: Sport, records: SessionRecord[]) =>
  detectClimbs(sport, records, windowedGradients(records));

describe('detectClimbs', () => {
  it('keeps a flatter bit inside a climb until the gradient drops below the exit threshold', () => {
    const steep = { metres: 250, gradient: 0.2 };
    const withFlatterBit = ride([
      { metres: 100, gradient: 0 },
      steep,
      { metres: 200, gradient: 0.12 },
      steep,
    ]);
    const withRealBreak = ride([
      { metres: 100, gradient: 0 },
      steep,
      { metres: 200, gradient: 0.05 },
      steep,
    ]);
    expect(climbsOf('running', withFlatterBit)).toHaveLength(1);
    expect(climbsOf('running', withRealBreak)).toHaveLength(2);
  });

  it('needs 40 m and 90 s for a running climb and 50 m and 2 min for a cycling climb', () => {
    const gains45m = ride([
      { metres: 100, gradient: 0 },
      { metres: 225, gradient: 0.2 },
    ]);
    const gains45mFast = ride([
      { metres: 100, gradient: 0 },
      { metres: 225, gradient: 0.2, speed: 4 },
    ]);
    expect(climbsOf('running', gains45m)).toHaveLength(1);
    expect(climbsOf('running', gains45mFast)).toHaveLength(0);
    expect(climbsOf('cycling', gains45m)).toHaveLength(0);
  });

  it('merges climbs less than 120 s apart when running and 60 s apart when cycling', () => {
    const steep = { metres: 300, gradient: 0.2 };
    const records = ride([
      { metres: 100, gradient: 0 },
      steep,
      { metres: 100, gradient: 0 },
      steep,
    ]);
    expect(climbsOf('running', records)).toHaveLength(1);
    expect(climbsOf('cycling', records)).toHaveLength(2);
  });

  it('splits a climb where elevation is missing', () => {
    const records = ride([
      { metres: 100, gradient: 0 },
      { metres: 600, gradient: 0.2 },
    ]).map((r) => {
      if (r.timestamp >= 390 && r.timestamp < 410) return { ...r, elevation: undefined };
      return r;
    });
    expect(climbsOf('running', records)).toHaveLength(2);
  });

  it('measures VAM over moving time only, rounded to 10 m/h', () => {
    const records = ride([
      { metres: 100, gradient: 0 },
      { metres: 300, gradient: 0.2 },
    ]);
    const stopAt = records.findIndex((r) => r.timestamp === 250);
    const standing = Array.from({ length: 120 }, (_, i) => ({
      ...records[stopAt],
      timestamp: 251 + i,
      speed: 0,
    }));
    const resumed = records.slice(stopAt + 1).map((r) => ({ ...r, timestamp: r.timestamp + 121 }));
    const withStop = [...records.slice(0, stopAt + 1), ...standing, ...resumed] as SessionRecord[];
    const climbs = climbsOf('running', withStop);
    expect(climbs).toHaveLength(1);
    expect(climbs[0]?.vam).toBe(720);
    expect(climbingRate(withStop, climbs, 0, withStop.length - 1)).toBe(720);
  });
});
