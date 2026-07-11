import { describe, it, expect } from 'vitest';
import {
  saveStudioRoutePoints,
  getStudioRoutePoints,
  deleteStudioRoutePoints,
  clearAllRecords,
} from '@/lib/indexeddb.ts';
import type { RoutePoint } from '@/packages/gpx/routeGeometry.ts';

const makePoints = (count: number): RoutePoint[] =>
  Array.from({ length: count }, (_, i) => ({
    lat: 47 + i * 0.001,
    lng: 11 + i * 0.001,
    ele: 500 + i,
    seg: 0,
    dist: i * 100,
  }));

describe('studio route points (IndexedDB)', () => {
  it('saves and loads points for a route', async () => {
    await saveStudioRoutePoints('route-1', makePoints(5));
    const loaded = await getStudioRoutePoints('route-1');
    expect(loaded).toHaveLength(5);
    expect(loaded[0]).toEqual({ lat: 47, lng: 11, ele: 500, seg: 0, dist: 0 });
  });

  it('overwrites points on re-save', async () => {
    await saveStudioRoutePoints('route-2', makePoints(5));
    await saveStudioRoutePoints('route-2', makePoints(3));
    expect(await getStudioRoutePoints('route-2')).toHaveLength(3);
  });

  it('returns an empty array for an unknown route', async () => {
    expect(await getStudioRoutePoints('missing')).toEqual([]);
  });

  it('deletes points for a route', async () => {
    await saveStudioRoutePoints('route-3', makePoints(4));
    await deleteStudioRoutePoints('route-3');
    expect(await getStudioRoutePoints('route-3')).toEqual([]);
  });

  it('is wiped by clearAllRecords', async () => {
    await saveStudioRoutePoints('route-4', makePoints(4));
    await clearAllRecords();
    expect(await getStudioRoutePoints('route-4')).toEqual([]);
  });
});
