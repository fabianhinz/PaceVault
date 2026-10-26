import type { SessionLap, SessionRecord } from '@pacevault/engine/types.ts';

export const createMockSessionRecord = (overrides?: Partial<SessionRecord>): SessionRecord => ({
  timestamp: 0,
  ...overrides,
});

export const createMockSessionLap = (overrides?: Partial<SessionLap>): SessionLap => ({
  lapIndex: 0,
  startTime: 0,
  endTime: 300_000,
  totalTimerTime: 300,
  distance: 1000,
  intensity: 'active',
  ...overrides,
});
