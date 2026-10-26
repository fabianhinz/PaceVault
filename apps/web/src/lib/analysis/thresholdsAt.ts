import { valueAt } from '@pacevault/engine/datedValue.ts';
import type { Gender } from '@pacevault/engine/types.ts';
import type { UserProfile } from '@/types.ts';

export interface ResolvedThresholds {
  restHr: number;
  maxHr: number;
  /** Raw threshold HR; `undefined` means the engine's estimate applies. */
  thresholdHr?: number;
  ftp?: number;
  thresholdPace?: number;
  weightKg?: number;
  age?: number;
  gender: Gender;
}

/** The profile fields thresholds are resolved from; the demo builder has no `id` or `createdAt`. */
export type ThresholdsProfile = Pick<UserProfile, 'thresholds' | 'weight' | 'birthYear' | 'gender'>;

const requiredValueAt = ({
  history,
  date,
  key,
}: {
  history: UserProfile['thresholds']['restHr'];
  date: number;
  key: string;
}): number => {
  const value = valueAt({ history, date });
  if (value === undefined) throw new Error(`Profile has no ${key} entry`);
  return value;
};

const optionalValueAt = ({
  history,
  date,
}: {
  history: UserProfile['weight'];
  date: number;
}): number | undefined => {
  if (history === undefined) return undefined;
  return valueAt({ history, date });
};

const ageAt = ({
  birthYear,
  date,
}: {
  birthYear: number | undefined;
  date: number;
}): number | undefined => {
  if (birthYear === undefined) return undefined;
  return new Date(date).getFullYear() - birthYear;
};

export const thresholdsAt = ({
  profile,
  date,
}: {
  profile: ThresholdsProfile;
  date: number;
}): ResolvedThresholds => ({
  restHr: requiredValueAt({ history: profile.thresholds.restHr, date, key: 'restHr' }),
  maxHr: requiredValueAt({ history: profile.thresholds.maxHr, date, key: 'maxHr' }),
  thresholdHr: optionalValueAt({ history: profile.thresholds.thresholdHr, date }),
  ftp: optionalValueAt({ history: profile.thresholds.ftp, date }),
  thresholdPace: optionalValueAt({ history: profile.thresholds.thresholdPace, date }),
  weightKg: optionalValueAt({ history: profile.weight, date }),
  age: ageAt({ birthYear: profile.birthYear, date }),
  gender: profile.gender,
});
