import type { UserProfile } from '@/types/index.ts';
import type { Gender } from '@/packages/engine/types.ts';

interface FitParseProfile {
  restHr: number;
  maxHr: number;
  gender: Gender;
  ftp?: number;
}

export const toFitParseProfile = (profile: UserProfile): FitParseProfile => {
  return {
    restHr: profile.thresholds.restHr,
    maxHr: profile.thresholds.maxHr,
    gender: profile.gender,
    ftp: profile.thresholds.ftp,
  };
};
