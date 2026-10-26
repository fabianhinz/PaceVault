import { m } from '@pacevault/i18n/messages.js';
import type { RoutePoint } from '@pacevault/gpx/types.ts';
import { sliceRoute } from '@pacevault/gpx/routeCut.ts';
import { useStudioStore, type StudioRoute } from '@/store/studio.ts';
import { toKm } from '@/lib/formatters.ts';
import { useStudioRoutePoints } from '@/queries/studio/useStudioRoutePoints.ts';
import { segmentAtDistance, type RouteSegment } from '@/features/studio/markers/routeSegments.ts';
import type { StudioTrackPickInfo } from '@/features/studio/types.ts';
import { useStudioRouteExport, type StudioRouteExport } from './useStudioRouteExport.ts';

interface StudioTrackPickSegment {
  route: StudioRoute | undefined;
  routeExport: StudioRouteExport;
  segment: RouteSegment | null;
  segmentPointCount: number;
  splitsPresent: boolean;
  segmentTooShort: boolean;
  exportLabel: string;
  subtitleParts: string[];
}

const segmentOf = ({
  route,
  splitDistances,
  distanceM,
}: {
  route: StudioRoute | undefined;
  splitDistances: number[];
  distanceM: number;
}): RouteSegment | null => {
  if (!route) return null;
  return segmentAtDistance({ splitDistancesM: splitDistances, totalM: route.distance, distanceM });
};

const segmentPointCountOf = ({
  segment,
  points,
}: {
  segment: RouteSegment | null;
  points: RoutePoint[] | undefined;
}): number => {
  if (!segment || !points) return 0;
  return sliceRoute({ points, startMeters: segment.startM, endMeters: segment.endM }).length;
};

const exportLabelFor = ({
  splitsPresent,
  segmentTooShort,
}: {
  splitsPresent: boolean;
  segmentTooShort: boolean;
}): string => {
  if (!splitsPresent) return m.ui_studio_export_route();
  if (segmentTooShort) return m.ui_studio_export_segment_too_short();
  return m.ui_studio_export_segment();
};

const subtitlePartsFor = ({
  distanceM,
  segment,
}: {
  distanceM: number;
  segment: RouteSegment | null;
}): string[] => {
  const subtitleParts = [m.ui_studio_pick_from_start({ km: toKm(distanceM) })];
  if (segment && segment.startSplit !== null) {
    subtitleParts.push(m.ui_studio_pick_from_split({ km: toKm(distanceM - segment.startM) }));
  }
  return subtitleParts;
};

export const useStudioTrackPickSegment = (info: StudioTrackPickInfo): StudioTrackPickSegment => {
  const route = useStudioStore((s) => s.routes.find((r) => r.id === info.routeId));
  const routeExport = useStudioRouteExport();
  const routePoints = useStudioRoutePoints({ routeId: info.routeId });
  const splitDistances = (route?.markers ?? [])
    .filter((mk) => mk.type === 'track_modifier')
    .map((mk) => mk.distanceM);
  const splitsPresent = splitDistances.length > 0;
  const segment = segmentOf({ route, splitDistances, distanceM: info.distanceM });
  const segmentPointCount = segmentPointCountOf({ segment, points: routePoints.data });
  const segmentTooShort = routePoints.data !== undefined && segmentPointCount < 2;

  return {
    route,
    routeExport,
    segment,
    segmentPointCount,
    splitsPresent,
    segmentTooShort,
    exportLabel: exportLabelFor({ splitsPresent, segmentTooShort }),
    subtitleParts: subtitlePartsFor({ distanceM: info.distanceM, segment }),
  };
};
