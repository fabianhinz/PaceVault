import { useEffect, useState } from 'react';
import type { RoutePoint } from '@/packages/gpx/routeGeometry.ts';
import { getStudioRoutePoints } from '@/lib/indexeddb.ts';

/** Lazily loads the full point array of a studio route from IndexedDB. `null` while loading. */
export const useStudioRoutePoints = (routeId: string) => {
  const [points, setPoints] = useState<RoutePoint[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPoints(null);
    getStudioRoutePoints(routeId).then((loaded) => {
      if (!cancelled) {
        setPoints(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [routeId]);

  return { points };
};
