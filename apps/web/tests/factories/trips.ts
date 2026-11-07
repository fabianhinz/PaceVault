import type { Trip } from '@/store/trips.ts';

export const createMockTrip = (overrides?: Partial<Trip>): Trip => ({
  id: 'trip-1',
  name: 'Alps',
  sessionIds: [],
  createdAt: 1_767_225_600_000,
  ...overrides,
});
