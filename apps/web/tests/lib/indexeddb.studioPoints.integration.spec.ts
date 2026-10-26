import { describe, it, expect } from 'vite-plus/test';
import {
  saveStudioRoutePoints,
  getStudioRoutePoints,
  deleteStudioRoutePoints,
  clearAllRecords,
} from '@/lib/db.ts';
import type { RoutePoint } from '@pacevault/gpx/types.ts';
import { createMockRoutePoint } from '@pacevault/testing/route.ts';

const routePointsAlong = (count: number): RoutePoint[] =>
  Array.from({ length: count }, (_, i) =>
    createMockRoutePoint({ lat: 47 + i * 0.001, lng: 11 + i * 0.001, ele: 500 + i, dist: i * 100 }),
  );

describe('studio route points (IndexedDB)', () => {
  it('saves and loads points for a route', async () => {
    await saveStudioRoutePoints({ routeId: 'route-1', points: routePointsAlong(5) });
    const loaded = await getStudioRoutePoints('route-1');
    expect(loaded).toHaveLength(5);
    expect(loaded[0]).toEqual({ lat: 47, lng: 11, ele: 500, seg: 0, dist: 0 });
  });

  it('overwrites points on re-save', async () => {
    await saveStudioRoutePoints({ routeId: 'route-2', points: routePointsAlong(5) });
    await saveStudioRoutePoints({ routeId: 'route-2', points: routePointsAlong(3) });
    expect(await getStudioRoutePoints('route-2')).toHaveLength(3);
  });

  it('returns an empty array for an unknown route', async () => {
    expect(await getStudioRoutePoints('missing')).toEqual([]);
  });

  it('deletes points for a route', async () => {
    await saveStudioRoutePoints({ routeId: 'route-3', points: routePointsAlong(4) });
    await deleteStudioRoutePoints('route-3');
    expect(await getStudioRoutePoints('route-3')).toEqual([]);
  });

  it('is wiped by clearAllRecords', async () => {
    await saveStudioRoutePoints({ routeId: 'route-4', points: routePointsAlong(4) });
    await clearAllRecords();
    expect(await getStudioRoutePoints('route-4')).toEqual([]);
  });
});
