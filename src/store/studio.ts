import { v4 } from 'uuid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GPSBounds } from '@/packages/engine/types.ts';
import type { RouteElevationStats } from '@/packages/gpx/routeGeometry.ts';
import { idbStorage } from '@/lib/idbStorage.ts';

export type StudioRouteColor = 'emerald' | 'sky' | 'amber' | 'rose' | 'violet' | 'cyan';

export type StudioMarkerType = 'track_modifier' | 'point_of_interest';

interface StudioMarkerBase {
  id: string;
  /**
   * Position as distance from the route start in metres. lat/lng is derived by
   * interpolating the route polyline at this distance — every marker snaps to
   * the track for now.
   */
  distanceM: number;
}

/** A split point — later exports the route on either side as separate GPX tracks. */
export interface TrackModifierMarker extends StudioMarkerBase {
  type: 'track_modifier';
}

/** A named point of interest along the route. */
export interface PointOfInterestMarker extends StudioMarkerBase {
  type: 'point_of_interest';
  label: string;
  description?: string;
}

export type StudioMarker = TrackModifierMarker | PointOfInterestMarker;

/** Omit that distributes over a union so per-member fields (e.g. `label`) survive. */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

export type StudioMarkerInput = DistributiveOmit<StudioMarker, 'id'>;
export type StudioMarkerPatch = Partial<DistributiveOmit<StudioMarker, 'id' | 'type'>>;

export interface StudioRoute {
  id: string;
  name: string;
  sourceFileName: string;
  importedAt: number;
  color: StudioRouteColor;
  /** One encoded polyline per GPX segment — disconnected segments stay disconnected. */
  encodedPolylines: string[];
  bounds: GPSBounds;
  /** Total route distance in metres. */
  distance: number;
  elevation?: RouteElevationStats;
  markers: StudioMarker[];
}

interface StudioState {
  routes: StudioRoute[];
  importStudioRoute: (route: Omit<StudioRoute, 'id' | 'importedAt' | 'markers'>) => string;
  renameStudioRoute: (id: string, name: string) => void;
  setStudioRouteColor: (id: string, color: StudioRouteColor) => void;
  deleteStudioRoute: (id: string) => void;
  addStudioMarker: (routeId: string, marker: StudioMarkerInput) => string;
  updateStudioMarker: (routeId: string, markerId: string, patch: StudioMarkerPatch) => void;
  deleteStudioMarker: (routeId: string, markerId: string) => void;
  clearAll: () => void;
}

export const useStudioStore = create<StudioState>()(
  immer(
    persist(
      (set) => ({
        routes: [],
        importStudioRoute: (route) => {
          const id = v4();
          set((draft) => {
            draft.routes.push({ ...route, id, importedAt: Date.now(), markers: [] });
          });
          return id;
        },
        renameStudioRoute: (id, name) =>
          set((draft) => {
            const target = draft.routes.find((r) => r.id === id);
            if (target) {
              target.name = name;
            }
          }),
        setStudioRouteColor: (id, color) =>
          set((draft) => {
            const target = draft.routes.find((r) => r.id === id);
            if (target) {
              target.color = color;
            }
          }),
        deleteStudioRoute: (id) =>
          set((draft) => {
            draft.routes = draft.routes.filter((r) => r.id !== id);
          }),
        addStudioMarker: (routeId, marker) => {
          const id = v4();
          set((draft) => {
            const route = draft.routes.find((r) => r.id === routeId);
            if (route) {
              // Spreading a discriminated union loses the type→field correlation;
              // the input is already well-typed, so re-assert the union.
              route.markers.push({ ...marker, id } as StudioMarker);
            }
          });
          return id;
        },
        updateStudioMarker: (routeId, markerId, patch) =>
          set((draft) => {
            const route = draft.routes.find((r) => r.id === routeId);
            const marker = route?.markers.find((mk) => mk.id === markerId);
            if (marker) {
              Object.assign(marker, patch);
            }
          }),
        deleteStudioMarker: (routeId, markerId) =>
          set((draft) => {
            const route = draft.routes.find((r) => r.id === routeId);
            if (route) {
              route.markers = route.markers.filter((mk) => mk.id !== markerId);
            }
          }),
        clearAll: () => set({ routes: [] }),
      }),
      {
        name: 'store-studio',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 2,
        migrate: (persisted, version) => {
          const state = persisted as { routes?: StudioRoute[] };
          if (version < 2) {
            for (const route of state.routes ?? []) {
              route.markers = route.markers ?? [];
            }
          }
          return state as unknown as StudioState;
        },
      },
    ),
  ),
);
