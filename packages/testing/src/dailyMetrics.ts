import type { DailyMetrics } from '@pacevault/engine/types.ts';

export const createMockDailyMetrics = (overrides?: Partial<DailyMetrics>): DailyMetrics => ({
  date: '2026-02-20',
  tss: 50,
  ctl: 40,
  atl: 50,
  tsb: -10,
  acwr: 1.0,
  ...overrides,
});
