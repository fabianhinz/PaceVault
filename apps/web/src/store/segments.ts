import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { GPSBounds, Sport } from '@pacevault/engine/types.ts';
import { idbStorage } from '@/lib/storage/db.ts';

export type SegmentSourceKind = 'range' | 'session';

interface SegmentSource {
  sessionId: string;
  kind: SegmentSourceKind;
  startSec: number;
  endSec: number;
}

export interface Segment {
  id: string;
  name: string;
  sport: Sport;
  source: SegmentSource;
  distanceMeters: number;
  netElevationMeters: number | null;
  encodedPolyline: string;
  bounds: GPSBounds;
  createdAt: number;
}

interface SegmentsState {
  segments: Segment[];
  addSegment: (segment: Segment) => void;
  renameSegment: ({ id, name }: { id: string; name: string }) => void;
  removeSegment: (id: string) => void;
  removeSegmentsOfSession: (sessionId: string) => string[];
  clearAll: () => void;
}

export const INITIAL_SEGMENTS_STORE_STATE: Pick<SegmentsState, 'segments'> = {
  segments: [],
};

export const useSegmentsStore = create<SegmentsState>()(
  immer(
    persist(
      (set, get) => ({
        ...INITIAL_SEGMENTS_STORE_STATE,
        addSegment: (segment) =>
          set((draft) => {
            draft.segments.push(segment);
          }),
        renameSegment: ({ id, name }) =>
          set((draft) => {
            const target = draft.segments.find((segment) => segment.id === id);
            if (target) target.name = name;
          }),
        removeSegment: (id) =>
          set((draft) => {
            draft.segments = draft.segments.filter((segment) => segment.id !== id);
          }),
        removeSegmentsOfSession: (sessionId) => {
          const removedIds = get()
            .segments.filter((segment) => segment.source.sessionId === sessionId)
            .map((segment) => segment.id);
          if (removedIds.length === 0) return removedIds;
          set((draft) => {
            draft.segments = draft.segments.filter(
              (segment) => segment.source.sessionId !== sessionId,
            );
          });
          return removedIds;
        },
        clearAll: () => set(INITIAL_SEGMENTS_STORE_STATE),
      }),
      {
        name: 'store-segments',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);
