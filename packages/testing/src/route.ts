import type { GpxMetadata, GpxPoint, GpxWaypoint } from '@pacevault/gpx/buildGpx.ts';
import type { ParsedGpxPoint } from '@pacevault/gpx/parseGpx.ts';
import type { RoutePoint } from '@pacevault/gpx/types.ts';

export const createMockParsedGpxPoint = (overrides?: Partial<ParsedGpxPoint>): ParsedGpxPoint => ({
  lat: 47,
  lng: 11,
  seg: 0,
  ...overrides,
});

export const createMockRoutePoint = (overrides?: Partial<RoutePoint>): RoutePoint => ({
  ...createMockParsedGpxPoint(),
  dist: 0,
  ...overrides,
});

export const createMockGpxPoint = (overrides?: Partial<GpxPoint>): GpxPoint => ({
  lat: 48.137,
  lon: 11.575,
  ...overrides,
});

export const createMockGpxWaypoint = (overrides?: Partial<GpxWaypoint>): GpxWaypoint => ({
  lat: 48.138,
  lon: 11.576,
  name: 'Summit',
  ...overrides,
});

export const createMockGpxMetadata = (overrides?: Partial<GpxMetadata>): GpxMetadata => ({
  time: new Date('2026-01-01'),
  ...overrides,
});
