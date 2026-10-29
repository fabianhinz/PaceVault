import type { UserProfile } from '@/types.ts';

export const createMockUserProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
  id: 'test-user-id',
  gender: 'male',
  thresholds: {
    ftp: [{ date: 0, value: 250 }],
    maxHr: [{ date: 0, value: 190 }],
    restHr: [{ date: 0, value: 50 }],
  },
  showMetricHelp: true,
  createdAt: Date.now(),
  ...overrides,
});
