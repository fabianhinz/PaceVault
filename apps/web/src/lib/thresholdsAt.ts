import { valueAt } from '@pacevault/engine/datedValue.ts';
import type { Gender } from '@pacevault/engine/types.ts';
import type { UserProfile } from '@/types/index.ts';

export interface ResolvedThresholds {
  restHr: number;
  maxHr: number;
  ftp?: number;
  thresholdPace?: number;
  weightKg?: number;
  age?: number;
  gender: Gender;
}

const requiredValueAt = (
  history: UserProfile['thresholds']['restHr'],
  date: number,
  key: string,
): number => {
  const value = valueAt(history, date);
  if (value === undefined) throw new Error(`Profile has no ${key} entry`);
  return value;
};

const optionalValueAt = (history: UserProfile['weight'], date: number): number | undefined => {
  if (history === undefined) return undefined;
  return valueAt(history, date);
};

const ageAt = (birthYear: number | undefined, date: number): number | undefined => {
  if (birthYear === undefined) return undefined;
  return new Date(date).getFullYear() - birthYear;
};

export const thresholdsAt = (profile: UserProfile, date: number): ResolvedThresholds => ({
  restHr: requiredValueAt(profile.thresholds.restHr, date, 'restHr'),
  maxHr: requiredValueAt(profile.thresholds.maxHr, date, 'maxHr'),
  ftp: optionalValueAt(profile.thresholds.ftp, date),
  thresholdPace: optionalValueAt(profile.thresholds.thresholdPace, date),
  weightKg: optionalValueAt(profile.weight, date),
  age: ageAt(profile.birthYear, date),
  gender: profile.gender,
});
