import { v4 } from 'uuid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/storage/db.ts';
import type {
  PointOfInterestMarker,
  StudioMarker,
  StudioRoute,
  StudioRouteColor,
} from '@/types.ts';

const REPLACED_ROUTE_COLORS: Record<string, StudioRouteColor> = { sky: 'fuchsia', cyan: 'violet' };

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

type StudioMarkerInput = DistributiveOmit<StudioMarker, 'id'>;
type StudioPoiFields = Pick<PointOfInterestMarker, 'distanceM' | 'label' | 'description'>;

interface StudioState {
  routes: StudioRoute[];
  importStudioRoute: (route: Omit<StudioRoute, 'id' | 'importedAt' | 'markers'>) => string;
  renameStudioRoute: ({ id, name }: { id: string; name: string }) => void;
  setStudioRouteColor: ({ id, color }: { id: string; color: StudioRouteColor }) => void;
  deleteStudioRoute: (id: string) => void;
  addStudioMarker: ({ routeId, marker }: { routeId: string; marker: StudioMarkerInput }) => string;
  moveStudioMarker: ({
    routeId,
    markerId,
    distanceM,
  }: {
    routeId: string;
    markerId: string;
    distanceM: number;
  }) => void;
  updateStudioPoi: ({
    routeId,
    markerId,
    fields,
  }: {
    routeId: string;
    markerId: string;
    fields: StudioPoiFields;
  }) => void;
  deleteStudioMarker: ({ routeId, markerId }: { routeId: string; markerId: string }) => void;
  clearAll: () => void;
}

export const INITIAL_STUDIO_STORE_STATE: Pick<StudioState, 'routes'> = {
  routes: [],
};

export const useStudioStore = create<StudioState>()(
  immer(
    persist(
      (set) => ({
        ...INITIAL_STUDIO_STORE_STATE,
        importStudioRoute: (route) => {
          const id = v4();
          set((draft) => {
            draft.routes.push({ ...route, id, importedAt: Date.now(), markers: [] });
          });
          return id;
        },
        renameStudioRoute: ({ id, name }) =>
          set((draft) => {
            const target = draft.routes.find((r) => r.id === id);
            if (target) {
              target.name = name;
            }
          }),
        setStudioRouteColor: ({ id, color }) =>
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
        addStudioMarker: ({ routeId, marker }) => {
          const id = v4();
          set((draft) => {
            const route = draft.routes.find((r) => r.id === routeId);
            if (route) {
              route.markers.push({ ...marker, id });
            }
          });
          return id;
        },
        moveStudioMarker: ({ routeId, markerId, distanceM }) =>
          set((draft) => {
            const route = draft.routes.find((r) => r.id === routeId);
            const marker = route?.markers.find((mk) => mk.id === markerId);
            if (marker) {
              marker.distanceM = distanceM;
            }
          }),
        updateStudioPoi: ({ routeId, markerId, fields }) =>
          set((draft) => {
            const route = draft.routes.find((r) => r.id === routeId);
            const marker = route?.markers.find((mk) => mk.id === markerId);
            if (marker?.type === 'point_of_interest') {
              marker.distanceM = fields.distanceM;
              marker.label = fields.label;
              marker.description = fields.description;
            }
          }),
        deleteStudioMarker: ({ routeId, markerId }) =>
          set((draft) => {
            const route = draft.routes.find((r) => r.id === routeId);
            if (route) {
              route.markers = route.markers.filter((mk) => mk.id !== markerId);
            }
          }),
        clearAll: () => set(INITIAL_STUDIO_STORE_STATE),
      }),
      {
        name: 'store-studio',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 3,
        migrate: (persisted, version) => {
          const state = persisted as { routes?: StudioRoute[] };
          if (version < 2) {
            for (const route of state.routes ?? []) {
              route.markers = route.markers ?? [];
            }
          }
          if (version < 3) {
            for (const route of state.routes ?? []) {
              route.color = REPLACED_ROUTE_COLORS[route.color] ?? route.color;
            }
          }
          return state as unknown as StudioState;
        },
      },
    ),
  ),
);
