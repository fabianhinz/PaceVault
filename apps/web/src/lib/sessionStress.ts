import { stressFromRecords, stressFromSummary } from '@pacevault/engine/stress.ts';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import type { UserProfile } from '@/types.ts';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';

export type StoredSessionStress = Pick<TrainingSession, 'tss' | 'stressMethod' | 'normalizedPower'>;

type StressInputs = Pick<
  TrainingSession,
  'date' | 'duration' | 'avgHr' | 'normalizedPower' | 'sport'
>;

/** Metadata path: re-scores from the stored summary, reads no records. */
export const sessionStressAt = ({
  session,
  profile,
}: {
  session: StressInputs;
  profile: UserProfile;
}): StoredSessionStress => {
  const thresholds = thresholdsAt({ profile, date: session.date });
  const stress = stressFromSummary({
    sport: session.sport,
    summary: {
      durationSec: session.duration,
      avgHr: session.avgHr,
      normalizedPower: session.normalizedPower,
    },
    thresholds,
  });
  return {
    tss: stress.tss,
    stressMethod: stress.stressMethod,
    normalizedPower: session.normalizedPower,
  };
};

/** Records path: the same call as the parser, with the thresholds at the session date. */
export const sessionStressFromRecordsAt = ({
  session,
  records,
  profile,
}: {
  session: StressInputs;
  records: SessionRecord[];
  profile: UserProfile;
}): StoredSessionStress => {
  const stress = stressFromRecords({
    sport: session.sport,
    records,
    summary: { durationSec: session.duration, avgHr: session.avgHr },
    thresholds: thresholdsAt({ profile, date: session.date }),
  });
  return {
    tss: stress.tss,
    stressMethod: stress.stressMethod,
    normalizedPower: stress.normalizedPower ?? session.normalizedPower,
  };
};

/** The profile values HR loads depend on: a change re-scores them from the records. */
export const trainingLoadHrSignature = (profile: UserProfile | null): string => {
  if (profile === null) return '';
  return JSON.stringify([
    profile.gender,
    profile.thresholds.restHr,
    profile.thresholds.maxHr,
    profile.thresholds.thresholdHr ?? [],
  ]);
};

/** The profile values TSS depends on: a change re-scores rides from their stored NP. */
export const trainingLoadFtpSignature = (profile: UserProfile | null): string => {
  if (profile === null) return '';
  return JSON.stringify(profile.thresholds.ftp ?? []);
};
