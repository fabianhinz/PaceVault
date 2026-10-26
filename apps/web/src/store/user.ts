import { v4 } from 'uuid';
import { z } from 'zod';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { DatedValue, Gender } from '@pacevault/engine/types.ts';
import type { UserProfile } from '@/types.ts';
import { upsertDatedValue, valueAt } from '@pacevault/engine/datedValue.ts';
import { idbStorage } from '@/lib/db.ts';

export type ThresholdKey = 'restHr' | 'maxHr' | 'thresholdHr' | 'ftp' | 'thresholdPace' | 'weight';

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

// v4 adds the optional dated `thresholds.thresholdHr`: a v3 profile has none and needs no step.
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

type Thresholds = UserProfile['thresholds'];

const isPositive = (value: number): boolean => Number.isFinite(value) && value > 0;

const positiveEntries = (history: DatedValue<number>[]): DatedValue<number>[] =>
  history.filter((entry) => isPositive(entry.value));

const isMaxHrAboveRestHr = ({
  maxHr,
  restHr,
}: {
  maxHr: number | undefined;
  restHr: number | undefined;
}): boolean => {
  if (maxHr === undefined || restHr === undefined) return true;
  return maxHr > restHr;
};

const hasInvalidThreshold = (thresholds: Thresholds): boolean => {
  const histories = [
    thresholds.restHr,
    thresholds.maxHr,
    thresholds.thresholdHr ?? [],
    thresholds.ftp ?? [],
    thresholds.thresholdPace ?? [],
  ];
  if (histories.some((history) => history.some((entry) => !isPositive(entry.value)))) return true;
  return thresholds.maxHr.some(
    (entry) =>
      !isMaxHrAboveRestHr({
        maxHr: entry.value,
        restHr: valueAt({ history: thresholds.restHr, date: entry.date }),
      }),
  );
};

// Invalid stored entries are dropped like malformed ones; the profile and its other entries stay.
const withoutInvalidThresholds = (thresholds: Thresholds): Thresholds => {
  const restHr = positiveEntries(thresholds.restHr);
  const maxHr = positiveEntries(thresholds.maxHr);
  const result: Thresholds = {
    ...thresholds,
    restHr: restHr.filter((entry) =>
      isMaxHrAboveRestHr({
        maxHr: valueAt({ history: maxHr, date: entry.date }),
        restHr: entry.value,
      }),
    ),
    maxHr: maxHr.filter((entry) =>
      isMaxHrAboveRestHr({
        maxHr: entry.value,
        restHr: valueAt({ history: restHr, date: entry.date }),
      }),
    ),
  };
  if (thresholds.thresholdHr !== undefined) {
    result.thresholdHr = positiveEntries(thresholds.thresholdHr);
  }
  if (thresholds.ftp !== undefined) result.ftp = positiveEntries(thresholds.ftp);
  if (thresholds.thresholdPace !== undefined) {
    result.thresholdPace = positiveEntries(thresholds.thresholdPace);
  }
  return result;
};

const thresholdsSchema = z
  .object({
    restHr: requiredHistorySchema,
    maxHr: requiredHistorySchema,
    thresholdHr: historySchema.optional(),
    ftp: historySchema.optional(),
    thresholdPace: historySchema.optional(),
  })
  .transform(withoutInvalidThresholds)
  .refine((thresholds) => thresholds.restHr.length > 0 && thresholds.maxHr.length > 0);

const profileSchema = z.looseObject({
  id: z.string(),
  gender: z.enum(['male', 'female']),
  thresholds: thresholdsSchema,
  weight: historySchema.transform(positiveEntries).optional(),
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

const applyThresholdChanges = ({
  profile,
  changes,
  date,
}: {
  profile: UserProfile;
  changes: Partial<Record<ThresholdKey, number>>;
  date: number;
}): void => {
  const upsert = ({
    history,
    value,
  }: {
    history: DatedValue<number>[] | undefined;
    value: number;
  }) => upsertDatedValue({ history: history ?? [], entry: { date, value } });
  if (changes.restHr !== undefined) {
    profile.thresholds.restHr = upsert({
      history: profile.thresholds.restHr,
      value: changes.restHr,
    });
  }
  if (changes.maxHr !== undefined) {
    profile.thresholds.maxHr = upsert({
      history: profile.thresholds.maxHr,
      value: changes.maxHr,
    });
  }
  if (changes.thresholdHr !== undefined) {
    profile.thresholds.thresholdHr = upsert({
      history: profile.thresholds.thresholdHr,
      value: changes.thresholdHr,
    });
  }
  if (changes.ftp !== undefined) {
    profile.thresholds.ftp = upsert({
      history: profile.thresholds.ftp,
      value: changes.ftp,
    });
  }
  if (changes.thresholdPace !== undefined) {
    profile.thresholds.thresholdPace = upsert({
      history: profile.thresholds.thresholdPace,
      value: changes.thresholdPace,
    });
  }
  if (changes.weight !== undefined) {
    profile.weight = upsert({ history: profile.weight, value: changes.weight });
  }
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

export const INITIAL_USER_STORE_STATE: Pick<UserState, 'profile'> = {
  profile: null,
};

export const useUserStore = create<UserState>()(
  immer(
    persist(
      (set) => ({
        ...INITIAL_USER_STORE_STATE,

        setProfile: (data) => {
          if (hasInvalidThreshold(data.thresholds)) return;
          set({
            profile: {
              ...data,
              id: v4(),
              createdAt: Date.now(),
            },
          });
        },

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
            if (Object.values(changes).some((value) => !isPositive(value))) return;
            const date = todayMidnight();
            const maxHr = changes.maxHr ?? valueAt({ history: profile.thresholds.maxHr, date });
            const restHr = changes.restHr ?? valueAt({ history: profile.thresholds.restHr, date });
            if (!isMaxHrAboveRestHr({ maxHr, restHr })) return;
            applyThresholdChanges({ profile, changes, date });
          }),

        toggleMetricHelp: () =>
          set((draft) => {
            if (draft.profile) {
              draft.profile.showMetricHelp = !draft.profile.showMetricHelp;
            }
          }),

        resetProfile: () => set(INITIAL_USER_STORE_STATE),
      }),
      {
        name: 'store-user',
        storage: createJSONStorage(() => idbStorage),
        skipHydration: true,
        version: 4,
        migrate: (persisted, version) => migrateUserState(persisted, version) as UserState,
        merge: (persisted, current) => ({ ...current, profile: parsePersistedProfile(persisted) }),
      },
    ),
  ),
);
