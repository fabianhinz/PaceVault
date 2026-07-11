import { v4 } from 'uuid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GPSBounds } from '@/packages/engine/types.ts';
import type { RouteElevationStats } from '@/packages/gpx/routeGeometry.ts';
import { idbStorage } from '@/lib/idbStorage.ts';

export type StudioRouteColor = 'emerald' | 'sky' | 'amber' | 'rose' | 'violet' | 'cyan';

export interface StudioRoute {
  id: string;
  name: string;
  sourceFileName: string;
  importedAt: number;
  color: StudioRouteColor;
  encodedPolyline: string;
  bounds: GPSBounds;
  /** Total route distance in metres. */
  distance: number;
  elevation?: RouteElevationStats;
}

interface StudioState {
  routes: StudioRoute[];
  importStudioRoute: (route: Omit<StudioRoute, 'id' | 'importedAt'>) => string;
  renameStudioRoute: (id: string, name: string) => void;
  setStudioRouteColor: (id: string, color: StudioRouteColor) => void;
  deleteStudioRoute: (id: string) => void;
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
            draft.routes.push({ ...route, id, importedAt: Date.now() });
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
        clearAll: () => set({ routes: [] }),
      }),
      {
        name: 'store-studio',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);
