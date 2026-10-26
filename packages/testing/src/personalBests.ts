import type { PersonalBest } from '@pacevault/engine/types.ts';

export const createMockPersonalBest = (overrides?: Partial<PersonalBest>): PersonalBest => ({
  sport: 'cycling',
  category: 'peak-power',
  window: 5,
  value: 300,
  sessionId: 'session-id',
  date: 0,
  ...overrides,
});
