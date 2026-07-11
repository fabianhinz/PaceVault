import { useMemo } from 'react';
import { useMatch, useSearchParams } from 'react-router-dom';
import { unionBounds } from '@/packages/engine/gps.ts';
import type { GPSBounds } from '@/packages/engine/types.ts';
import { useStudioStore, type StudioRoute } from '@/store/studio.ts';
import { routeColors } from '@/features/studio/routeColors.ts';

export interface StudioMapRoute {
  id: string;
  encodedPolyline: string;
  color: [number, number, number];
  bounds: GPSBounds;
}

interface StudioMapTracks {
  /** True while the studio context (tab or route detail) owns the map. */
  active: boolean;
  /** Set on a route detail page — that route draws wider. */
  focusedRouteId: string | null;
  routes: StudioMapRoute[];
  bounds: GPSBounds | null;
}

const toMapRoute = (route: StudioRoute): StudioMapRoute => ({
  id: route.id,
  encodedPolyline: route.encodedPolyline,
  color: routeColors[route.color].rgb,
  bounds: route.bounds,
});

/**
 * Sessions are the app's primary map object — only in the studio context does
 * the map switch to routes: all imported routes on the studio tab, just the
 * selected one on a route detail page.
 *
 * Both contexts are derived synchronously from the URL (not from an
 * effect-written store field), so session tracks never flash in during the
 * tab → detail navigation.
 */
export const useStudioMapTracks = (): StudioMapTracks => {
  const allRoutes = useStudioStore((s) => s.routes);
  const detailMatch = useMatch('/studio/:id');
  const labsMatch = useMatch('/labs');
  const [searchParams] = useSearchParams();
  const onStudioTab = labsMatch !== null && searchParams.get('tab') === 'studio';
  const detailRouteId = detailMatch?.params.id ?? null;

  return useMemo(() => {
    if (detailRouteId) {
      const route = allRoutes.find((r) => r.id === detailRouteId);
      // Unknown id still keeps the studio context: not-found page, empty map.
      if (!route) {
        return { active: true, focusedRouteId: null, routes: [], bounds: null };
      }
      return {
        active: true,
        focusedRouteId: route.id,
        routes: [toMapRoute(route)],
        bounds: route.bounds,
      };
    }
    if (onStudioTab) {
      const routes = allRoutes.map(toMapRoute);
      return {
        active: true,
        focusedRouteId: null,
        routes,
        bounds: unionBounds(routes.map((r) => r.bounds)),
      };
    }
    return { active: false, focusedRouteId: null, routes: [], bounds: null };
  }, [detailRouteId, onStudioTab, allRoutes]);
};
