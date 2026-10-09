import { v4 } from 'uuid';
import { z } from 'zod';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Gender, UserProfile } from '@/types/index.ts';
import { idbStorage } from '@/lib/idbStorage.ts';

const persistedUserSchema = z.looseObject({ profile: z.looseObject({}).nullable() });

const withoutAutoSessionNames = (persisted: unknown): unknown => {
  const parsed = persistedUserSchema.safeParse(persisted);
  if (!parsed.success || parsed.data.profile === null) return persisted;
  const profile = { ...parsed.data.profile };
  delete profile.useAutoSessionNames;
  return { ...parsed.data, profile };
};

const migrateUserState = (persisted: unknown, version: number): unknown => {
  if (version < 2) return withoutAutoSessionNames(persisted);
  return persisted;
};

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  setProfileGender: (gender: Gender) => void;
  updateThresholds: (thresholds: UserProfile['thresholds']) => void;
  toggleMetricHelp: () => void;
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

        resetProfile: () => set({ profile: null }),
      }),
      {
        name: 'store-user',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 2,
        migrate: (persisted, version) => migrateUserState(persisted, version) as UserState,
      },
    ),
  ),
);
