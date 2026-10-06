import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { idbStorage } from '@/lib/idbStorage.ts';
import type { ColorMode } from '@/lib/colorModes.ts';

interface SessionColoringState {
  colorMode: ColorMode;
  setSessionColorMode: (mode: ColorMode) => void;
}

export const useSessionColoringStore = create<SessionColoringState>()(
  immer(
    persist(
      (set) => ({
        colorMode: 'sport',
        setSessionColorMode: (mode) => set({ colorMode: mode }),
      }),
      {
        name: 'store-session-coloring',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);
