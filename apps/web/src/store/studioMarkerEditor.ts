import { create } from 'zustand';
import type { StudioMarkerType } from './studio.ts';

/**
 * Which marker the shared dialog is editing. Map pins and the Tools-tab cards
 * both open the same dialog through this store — the dialog itself is mounted
 * once at the route-detail level.
 */
interface StudioMarkerEditorState {
  routeId: string | null;
  /** `null` while adding a new marker; the target id while editing an existing one. */
  markerId: string | null;
  type: StudioMarkerType;
  /** Seed distance for a new marker (e.g. the clicked point on the track); `null` uses the default. */
  initialDistanceM: number | null;
  open: boolean;
  openCreate: (routeId: string, type: StudioMarkerType, initialDistanceM?: number) => void;
  openEdit: (routeId: string, markerId: string, type: StudioMarkerType) => void;
  close: () => void;
}

export const useStudioMarkerEditorStore = create<StudioMarkerEditorState>((set) => ({
  routeId: null,
  markerId: null,
  type: 'track_modifier',
  initialDistanceM: null,
  open: false,
  openCreate: (routeId, type, initialDistanceM) =>
    set({ routeId, markerId: null, type, initialDistanceM: initialDistanceM ?? null, open: true }),
  openEdit: (routeId, markerId, type) =>
    set({ routeId, markerId, type, initialDistanceM: null, open: true }),
  close: () => set({ open: false }),
}));
