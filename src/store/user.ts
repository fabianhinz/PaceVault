import { v4 } from 'uuid';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Gender, UserProfile } from '@/types/index.ts';
import { idbStorage } from '@/lib/idbStorage.ts';

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  setProfileGender: (gender: Gender) => void;
  updateThresholds: (thresholds: UserProfile['thresholds']) => void;
  toggleMetricHelp: () => void;
  toggleAutoSessionNames: () => void;
  resetProfile: () => void;
}

export const useUserStore = create<UserState>()(
  immer(
    persist(
      (set) => ({
        profile: null,

        setProfile: (data) =>
          set({
            profile: {
              ...data,
              id: v4(),
              createdAt: Date.now(),
            },
          }),

        setProfileGender: (gender) =>
          set((draft) => {
            if (draft.profile) {
              draft.profile.gender = gender;
            }
          }),

        updateThresholds: (thresholds) =>
          set((draft) => {
            if (draft.profile) {
              draft.profile.thresholds = thresholds;
            }
          }),

        toggleMetricHelp: () =>
          set((draft) => {
            if (draft.profile) {
              draft.profile.showMetricHelp = !draft.profile.showMetricHelp;
            }
          }),

        toggleAutoSessionNames: () =>
          set((draft) => {
            if (draft.profile) {
              draft.profile.useAutoSessionNames = !draft.profile.useAutoSessionNames;
            }
          }),

        resetProfile: () => set({ profile: null }),
      }),
      {
        name: 'store-user',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 1,
      },
    ),
  ),
);
