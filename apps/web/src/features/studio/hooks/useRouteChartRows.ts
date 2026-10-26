import { useMemo } from 'react';
import { buildRouteProfile } from '@pacevault/gpx/routeProfile.ts';
import type { RoutePoint } from '@pacevault/gpx/types.ts';
import { indexByX } from '@/lib/chartHover.ts';
import {
  buildRouteChartRows,
  gpsByX,
  routeChartProfile,
  type RouteChartProfile,
} from '@/lib/chartData.ts';

type RouteChartRow = ReturnType<typeof buildRouteChartRows>[number];

interface RouteChartRows {
  profile: RouteChartProfile;
  rows: RouteChartRow[];
  compactRows: RouteChartRow[];
  byDist: Map<number | string, RouteChartRow>;
  gpsLookup: Map<number, [number, number]>;
}

export const useRouteChartRows = ({
  points,
  zoomRange,
}: {
  points: RoutePoint[];
  zoomRange: { from: number; to: number } | null;
}): RouteChartRows => {
  const profile = useMemo(() => routeChartProfile(buildRouteProfile(points)), [points]);
  const rows = useMemo(() => buildRouteChartRows(profile), [profile]);
  const compactRows = useMemo(() => {
    if (zoomRange) return buildRouteChartRows(profile, zoomRange);
    return rows;
  }, [profile, zoomRange, rows]);
  const byDist = useMemo(
    () => new Map([...indexByX(rows, 'dist'), ...indexByX(compactRows, 'dist')]),
    [rows, compactRows],
  );
  const gpsLookup = useMemo(
    () => new Map([...gpsByX(rows, 'dist'), ...gpsByX(compactRows, 'dist')]),
    [rows, compactRows],
  );
  return { profile, rows, compactRows, byDist, gpsLookup };
};
