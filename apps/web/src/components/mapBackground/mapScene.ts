import type { RecordSpan } from '@/lib/analysis/laps.ts';
import type { MapHover, MapHoverKind } from '@/store/mapFocus.ts';

export type MapScene =
  | { kind: 'overview'; key: string }
  | { kind: 'trip'; key: string; sessionIds: string[] }
  | { kind: 'session'; key: string; sessionId: string }
  | { kind: 'segmentTab'; key: string }
  | { kind: 'segmentPage'; key: string; segmentId: string }
  | { kind: 'studioTab'; key: string }
  | { kind: 'studioRoute'; key: string; routeId: string };

export type MapSceneKind = MapScene['kind'];

export interface MapSceneRoute {
  path: string;
  sessionId: string | undefined;
  tripSessionIds: string[] | undefined;
  segmentId: string | undefined;
  studioRouteId: string | undefined;
  segmentTab: boolean;
  studioTab: boolean;
}

const NO_SESSION_IDS: string[] = [];

const sceneKeyOf = ({ kind, path }: { kind: MapSceneKind; path: string }): string =>
  `${kind} ${path}`;

const pageScene = (route: MapSceneRoute): MapScene | null => {
  const path = route.path;
  if (route.studioRouteId !== undefined) {
    return {
      kind: 'studioRoute',
      key: sceneKeyOf({ kind: 'studioRoute', path }),
      routeId: route.studioRouteId,
    };
  }
  if (route.segmentId !== undefined) {
    return {
      kind: 'segmentPage',
      key: sceneKeyOf({ kind: 'segmentPage', path }),
      segmentId: route.segmentId,
    };
  }
  if (route.sessionId !== undefined) {
    return {
      kind: 'session',
      key: sceneKeyOf({ kind: 'session', path }),
      sessionId: route.sessionId,
    };
  }
  return null;
};

export const mapSceneOf = (route: MapSceneRoute): MapScene => {
  const path = route.path;
  const page = pageScene(route);
  if (page !== null) return page;
  if (route.studioTab) return { kind: 'studioTab', key: sceneKeyOf({ kind: 'studioTab', path }) };
  if (route.segmentTab)
    return { kind: 'segmentTab', key: sceneKeyOf({ kind: 'segmentTab', path }) };
  if (route.tripSessionIds !== undefined && route.tripSessionIds.length > 0) {
    return {
      kind: 'trip',
      key: sceneKeyOf({ kind: 'trip', path }),
      sessionIds: route.tripSessionIds,
    };
  }
  return { kind: 'overview', key: sceneKeyOf({ kind: 'overview', path }) };
};

export const sceneSessionId = (scene: MapScene): string | null => {
  if (scene.kind === 'session') return scene.sessionId;
  return null;
};

export const sceneSegmentId = (scene: MapScene): string | null => {
  if (scene.kind === 'segmentPage') return scene.segmentId;
  return null;
};

export const sceneStudioRouteId = (scene: MapScene): string | null => {
  if (scene.kind === 'studioRoute') return scene.routeId;
  return null;
};

export const sceneTripSessionIds = (scene: MapScene): string[] => {
  if (scene.kind === 'trip') return scene.sessionIds;
  return NO_SESSION_IDS;
};

export const sceneHoveredId = ({
  hover,
  sceneKey,
  kind,
}: {
  hover: MapHover | null;
  sceneKey: string;
  kind: MapHoverKind;
}): string | null => {
  if (hover === null || hover.sceneKey !== sceneKey) return null;
  if (hover.target.kind !== kind) return null;
  return hover.target.id;
};

export const sceneHoveredSpan = ({
  hover,
  sceneKey,
}: {
  hover: MapHover | null;
  sceneKey: string;
}): RecordSpan | null => {
  if (hover === null || hover.sceneKey !== sceneKey) return null;
  if (hover.target.kind !== 'segmentSpan') return null;
  return hover.target.span;
};
