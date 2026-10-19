import { calculateSummaryStress } from '@pacevault/engine/stress.ts';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import type { UserProfile } from '@/types/index.ts';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';

export type StoredSessionStress = Pick<TrainingSession, 'tss' | 'stressMethod' | 'normalizedPower'>;

type StressInputs = Pick<TrainingSession, 'date' | 'duration' | 'avgHr' | 'normalizedPower'>;

export const sessionStressAt = (
  session: StressInputs,
  profile: UserProfile,
): StoredSessionStress => {
  const thresholds = thresholdsAt(profile, session.date);
  const stress = calculateSummaryStress(
    {
      durationSec: session.duration,
      avgHr: session.avgHr,
      normalizedPower: session.normalizedPower,
    },
    thresholds,
  );
  return {
    tss: stress.tss,
    stressMethod: stress.stressMethod,
    normalizedPower: session.normalizedPower,
  };
};

export const trainingLoadSignature = (profile: UserProfile | null): string => {
  if (profile === null) return '';
  return JSON.stringify([
    profile.gender,
    profile.thresholds.restHr,
    profile.thresholds.maxHr,
    profile.thresholds.ftp ?? [],
  ]);
};
