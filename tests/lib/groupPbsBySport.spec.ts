import { v4 } from 'uuid';
import { describe, it, expect } from 'vitest';
import { groupPBsBySport } from '@/lib/records.ts';
import type { PersonalBest } from '@/packages/engine/types.ts';

const makePB = (sport: 'running' | 'cycling', window: number): PersonalBest => {
  let category: PersonalBest['category'] = 'fastest-distance';
  if (sport === 'cycling') {
    category = 'peak-power';
  }
  let value = 300;
  if (sport === 'cycling') {
    value = 250;
  }
  return {
    sport,
    category,
    window,
    value,
    sessionId: v4(),
    date: Date.now(),
  };
};

describe('groupPBsBySport', () => {
  it('returns empty object for empty input', () => {
    expect(groupPBsBySport([])).toEqual({});
  });

  it('groups PBs by single sport', () => {
    const pbs = [makePB('running', 1000), makePB('running', 5000)];
    const result = groupPBsBySport(pbs);
    expect(Object.keys(result)).toEqual(['running']);
    expect(result.running).toHaveLength(2);
  });

  it('groups PBs by multiple sports', () => {
    const pbs = [
      makePB('running', 1000),
      makePB('cycling', 300),
      makePB('running', 5000),
      makePB('cycling', 1200),
    ];
    const result = groupPBsBySport(pbs);
    expect(result.running).toHaveLength(2);
    expect(result.cycling).toHaveLength(2);
  });

  it('preserves PB data within groups', () => {
    const pb = makePB('cycling', 300);
    const result = groupPBsBySport([pb]);
    expect(result.cycling?.[0]).toBe(pb);
  });
});
