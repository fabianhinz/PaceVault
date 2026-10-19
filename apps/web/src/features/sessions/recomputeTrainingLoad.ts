import type { TrainingSession } from '@pacevault/engine/types.ts';
import type { UserProfile } from '@/types/index.ts';
import { sessionStressAt } from '@/lib/sessionStress.ts';
import { withExclusiveLock } from '@/lib/webLock.ts';
import {
  guardedSessionsStorage,
  useSessionsStore,
  type RecomputedTrainingLoad,
} from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { REPROCESS_BATCH_SIZE, SESSION_REPROCESSING_LOCK } from './reprocessSessions.ts';

const changedTrainingLoad = (
  session: TrainingSession,
  profile: UserProfile,
): RecomputedTrainingLoad | undefined => {
  const stress = sessionStressAt(session, profile);
  if (
    stress.tss === session.tss &&
    stress.stressMethod === session.stressMethod &&
    stress.normalizedPower === session.normalizedPower
  ) {
    return undefined;
  }
  return { id: session.id, ...stress };
};

const changedSessions = (profile: UserProfile): RecomputedTrainingLoad[] => {
  const changes: RecomputedTrainingLoad[] = [];
  for (const session of useSessionsStore.getState().sessions) {
    const change = changedTrainingLoad(session, profile);
    if (change) changes.push(change);
  }
  return changes;
};

const commitChanges = async (changes: RecomputedTrainingLoad[]): Promise<void> => {
  useImportProgressStore.getState().beginReprocessing();
  try {
    useImportProgressStore.getState().setImportTotal(changes.length);
    for (let start = 0; start < changes.length; start += REPROCESS_BATCH_SIZE) {
      const batch = changes.slice(start, start + REPROCESS_BATCH_SIZE);
      useSessionsStore.getState().applyRecomputedTrainingLoad(batch);
      for (let i = 0; i < batch.length; i++) useImportProgressStore.getState().advanceImport();
      await guardedSessionsStorage.flush();
    }
  } finally {
    useImportProgressStore.getState().finishReprocessing();
  }
};

const runWithLock = async (): Promise<number> => {
  await useSessionsStore.persist.rehydrate();
  const profile = useUserStore.getState().profile;
  if (profile === null) return 0;
  const changes = changedSessions(profile);
  if (changes.length === 0) return 0;
  await commitChanges(changes);
  return changes.length;
};

/**
 * Brings every session's stored training load in line with the current profile's thresholds.
 * Metadata only: it reads no records. Shows the reprocess overlay only when a session changes.
 * @returns The number of sessions whose load changed.
 */
export const recomputeTrainingLoad = (): Promise<number> => {
  return withExclusiveLock(SESSION_REPROCESSING_LOCK, runWithLock);
};
