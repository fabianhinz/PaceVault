import type { UserProfile } from '@/types.ts';
import type { FitParseProfile } from '@/parsers/fit.ts';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';

export const toFitParseProfile =
  (profile: UserProfile) =>
  (date: number): FitParseProfile => {
    const resolved = thresholdsAt({ profile, date });
    return {
      restHr: resolved.restHr,
      maxHr: resolved.maxHr,
      gender: resolved.gender,
      ftp: resolved.ftp,
      thresholdHr: resolved.thresholdHr,
    };
  };
