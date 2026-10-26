import { v4 } from 'uuid';
import { describe, it, expect } from 'vite-plus/test';
import { groupPBsBySport } from '@/lib/records.ts';
import type { PersonalBest } from '@pacevault/engine/types.ts';
import { createMockPersonalBest } from '@pacevault/testing/personalBests.ts';

const pbFor = (sport: 'running' | 'cycling', window: number): PersonalBest => {
  let category: PersonalBest['category'] = 'fastest-distance';
  if (sport === 'cycling') {
    category = 'peak-power';
  }
  let value = 300;
  if (sport === 'cycling') {
    value = 250;
  }
  return createMockPersonalBest({ sport, window, category, value, sessionId: v4() });
};

describe(groupPBsBySport.name, () => {
  it('returns empty object for empty input', () => {
    expect(groupPBsBySport([])).toEqual({});
  });

  it('groups PBs by single sport', () => {
    const pbs = [pbFor('running', 1000), pbFor('running', 5000)];
    const result = groupPBsBySport(pbs);
    expect(Object.keys(result)).toEqual(['running']);
    expect(result.running).toHaveLength(2);
  });

  it('groups PBs by multiple sports', () => {
    const pbs = [
      pbFor('running', 1000),
      pbFor('cycling', 300),
      pbFor('running', 5000),
      pbFor('cycling', 1200),
    ];
    const result = groupPBsBySport(pbs);
    expect(result.running).toHaveLength(2);
    expect(result.cycling).toHaveLength(2);
  });

  it('preserves PB data within groups', () => {
    const pb = pbFor('cycling', 300);
    const result = groupPBsBySport([pb]);
    expect(result.cycling?.[0]).toBe(pb);
  });
});
