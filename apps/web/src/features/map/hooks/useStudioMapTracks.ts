import { useMemo } from 'react';
import { useMatch, useSearchParams } from 'react-router-dom';
import { unionBounds } from '@pacevault/engine/gps.ts';
import type { GPSBounds } from '@pacevault/engine/types.ts';
import { useStudioStore, type StudioRoute } from '@/store/studio.ts';
import { routeColors } from '@/features/studio/routeColors.ts';
import { resolveLabsTab } from '@/lib/labsTab.ts';

interface StudioMapRoute {
  id: string;
  encodedPolylines: string[];
  color: [number, number, number];
  bounds: GPSBounds;
}

interface StudioMapTracks {
  active: boolean;
  focusedRouteId: string | null;
  routeId: string | null;
  routes: StudioMapRoute[];
  bounds: GPSBounds | null;
}

const toMapRoute = (route: StudioRoute): StudioMapRoute => ({
  id: route.id,
  encodedPolylines: route.encodedPolylines,
  color: routeColors[route.color].rgb,
  bounds: route.bounds,
});

export const useStudioMapTracks = (): StudioMapTracks => {
  const allRoutes = useStudioStore((s) => s.routes);
  const detailMatch = useMatch('/studio/:id');
  const labsMatch = useMatch('/labs');
  const [searchParams] = useSearchParams();
  const onStudioTab = labsMatch !== null && resolveLabsTab(searchParams.get('tab')) === 'studio';
  const detailRouteId = detailMatch?.params.id ?? null;

  return useMemo(() => {
    if (detailRouteId) {
      const route = allRoutes.find((r) => r.id === detailRouteId);
      if (!route) {
        return {
          active: true,
          focusedRouteId: null,
          routeId: detailRouteId,
          routes: [],
          bounds: null,
        };
      }
      return {
        active: true,
        focusedRouteId: route.id,
        routeId: detailRouteId,
        routes: [toMapRoute(route)],
        bounds: route.bounds,
      };
    }
    if (onStudioTab) {
      const routes = allRoutes.map(toMapRoute);
      return {
        active: true,
        focusedRouteId: null,
        routeId: null,
        routes,
        bounds: unionBounds(routes.map((r) => r.bounds)),
      };
    }
    return { active: false, focusedRouteId: null, routeId: null, routes: [], bounds: null };
  }, [detailRouteId, onStudioTab, allRoutes]);
};
