import type { SessionGPS } from '@pacevault/engine/types.ts';

export const createMockSessionGPS = (overrides?: Partial<SessionGPS>): SessionGPS => ({
  sessionId: 'session-id',
  encodedPolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
  pointCount: 3,
  bounds: { minLat: 38.5, maxLat: 40.7, minLng: -122.4, maxLng: -120.2 },
  ...overrides,
});
