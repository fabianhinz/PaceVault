import { v4 } from 'uuid';
import { z } from 'zod';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Gender, UserProfile } from '@/types/index.ts';
import { upsertDatedValue, type DatedValue } from '@pacevault/engine/datedValue.ts';
import { idbStorage } from '@/lib/idbStorage.ts';

export type ThresholdKey = 'restHr' | 'maxHr' | 'ftp' | 'thresholdPace' | 'weight';

const persistedUserSchema = z.looseObject({ profile: z.looseObject({}).nullable() });

const withoutAutoSessionNames = (persisted: unknown): unknown => {
  const parsed = persistedUserSchema.safeParse(persisted);
  if (!parsed.success || parsed.data.profile === null) return persisted;
  const profile = { ...parsed.data.profile };
  delete profile.useAutoSessionNames;
  return { ...parsed.data, profile };
};

const flatThresholdsSchema = z.looseObject({
  profile: z.looseObject({
    thresholds: z.looseObject({
      restHr: z.number(),
      maxHr: z.number(),
      ftp: z.number().optional(),
      thresholdPace: z.number().optional(),
    }),
  }),
});

const epochEntry = (value: number): DatedValue<number>[] => [{ date: 0, value }];

const withDatedThresholds = (persisted: unknown): unknown => {
  const parsed = flatThresholdsSchema.safeParse(persisted);
  if (!parsed.success) return persisted;
  const flat = parsed.data.profile.thresholds;
  const thresholds: UserProfile['thresholds'] = {
    restHr: epochEntry(flat.restHr),
    maxHr: epochEntry(flat.maxHr),
  };
  if (flat.ftp !== undefined) thresholds.ftp = epochEntry(flat.ftp);
  if (flat.thresholdPace !== undefined) thresholds.thresholdPace = epochEntry(flat.thresholdPace);
  return { ...parsed.data, profile: { ...parsed.data.profile, thresholds } };
};

const migrateUserState = (persisted: unknown, version: number): unknown => {
  let state = persisted;
  if (version < 2) state = withoutAutoSessionNames(state);
  if (version < 3) state = withDatedThresholds(state);
  return state;
};

const datedNumberSchema = z.object({ date: z.number(), value: z.number() });

const validEntries = (entries: unknown[]): DatedValue<number>[] => {
  const valid: DatedValue<number>[] = [];
  for (const entry of entries) {
    const parsed = datedNumberSchema.safeParse(entry);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid.sort((a, b) => a.date - b.date);
};

const historySchema = z.array(z.unknown()).transform(validEntries);
const requiredHistorySchema = historySchema.pipe(z.array(datedNumberSchema).min(1));

const profileSchema = z.looseObject({
  id: z.string(),
  gender: z.enum(['male', 'female']),
  thresholds: z.object({
    restHr: requiredHistorySchema,
    maxHr: requiredHistorySchema,
    ftp: historySchema.optional(),
    thresholdPace: historySchema.optional(),
  }),
  weight: historySchema.optional(),
  birthYear: z.number().optional(),
  showMetricHelp: z.boolean(),
  createdAt: z.number(),
});

const hydratedUserSchema = z.looseObject({ profile: z.unknown() });

const parsePersistedProfile = (persisted: unknown): UserProfile | null => {
  const state = hydratedUserSchema.safeParse(persisted);
  if (!state.success) return null;
  const profile = profileSchema.safeParse(state.data.profile);
  if (!profile.success) return null;
  return profile.data;
};

const todayMidnight = (): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
};

interface UserState {
  profile: UserProfile | null;
  setProfile: (profile: Omit<UserProfile, 'id' | 'createdAt'>) => void;
  setProfileGender: (gender: Gender) => void;
  setProfileBirthYear: (birthYear: number | undefined) => void;
  saveTodaysThresholds: (changes: Partial<Record<ThresholdKey, number>>) => void;
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

        setProfileBirthYear: (birthYear) =>
          set((draft) => {
            if (draft.profile) {
              draft.profile.birthYear = birthYear;
            }
          }),

        saveTodaysThresholds: (changes) =>
          set((draft) => {
            const profile = draft.profile;
            if (!profile) return;
            const date = todayMidnight();
            const upsert = (history: DatedValue<number>[] | undefined, value: number) =>
              upsertDatedValue(history ?? [], { date, value });
            if (changes.restHr !== undefined) {
              profile.thresholds.restHr = upsert(profile.thresholds.restHr, changes.restHr);
            }
            if (changes.maxHr !== undefined) {
              profile.thresholds.maxHr = upsert(profile.thresholds.maxHr, changes.maxHr);
            }
            if (changes.ftp !== undefined) {
              profile.thresholds.ftp = upsert(profile.thresholds.ftp, changes.ftp);
            }
            if (changes.thresholdPace !== undefined) {
              profile.thresholds.thresholdPace = upsert(
                profile.thresholds.thresholdPace,
                changes.thresholdPace,
              );
            }
            if (changes.weight !== undefined) {
              profile.weight = upsert(profile.weight, changes.weight);
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
        version: 3,
        migrate: (persisted, version) => migrateUserState(persisted, version) as UserState,
        merge: (persisted, current) => ({ ...current, profile: parsePersistedProfile(persisted) }),
      },
    ),
  ),
);
