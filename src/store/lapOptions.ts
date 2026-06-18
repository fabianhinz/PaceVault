import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';
import type { Sport } from '@/packages/engine/types.ts';

export const DEFAULT_CUSTOM_DISTANCE: Record<Sport, number> = {
  running: 1000,
  cycling: 5000,
};

interface LapOptionsState {
  isDevice: boolean;
  customDistance: Record<Sport, number>;
  setIsDevice: (isDevice: boolean) => void;
  setCustomDistance: (sport: Sport, distance: number) => void;
}

export const useLapOptionsStore = create<LapOptionsState>()(
  immer(
    persist(
      (set) => ({
        isDevice: true,
        customDistance: { ...DEFAULT_CUSTOM_DISTANCE },
        setIsDevice: (isDevice) => set({ isDevice }),
        setCustomDistance: (sport, distance) =>
          set((draft) => {
            draft.customDistance[sport] = distance;
          }),
      }),
      {
        name: 'store-lap-options',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);
