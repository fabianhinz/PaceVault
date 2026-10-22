import type { TrainingSession } from '@pacevault/engine/types.ts';
import type { UserProfile } from '@/types/index.ts';
import {
  sessionStressAt,
  sessionStressFromRecordsAt,
  trainingLoadHrSignature,
  type StoredSessionStress,
} from '@/lib/sessionStress.ts';
import { getSessionRecords } from '@/lib/indexeddb.ts';
import { withExclusiveLock } from '@/lib/webLock.ts';
import {
  guardedSessionsStorage,
  useSessionsStore,
  type RecomputedTrainingLoad,
} from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { REPROCESS_BATCH_SIZE, SESSION_REPROCESSING_LOCK } from './reprocessSessions.ts';

const changedLoad = (
  session: TrainingSession,
  stress: StoredSessionStress,
): RecomputedTrainingLoad | undefined => {
  if (
    stress.tss === session.tss &&
    stress.stressMethod === session.stressMethod &&
    stress.normalizedPower === session.normalizedPower
  ) {
    return undefined;
  }
  return { id: session.id, ...stress };
};

/** FTP path: rides with a stored NP; every HR or duration load stays as stored. */
const scoresFromPower = (session: TrainingSession): boolean =>
  session.sport === 'cycling' && session.normalizedPower !== undefined;

const powerChanges = (profile: UserProfile): RecomputedTrainingLoad[] => {
  const changes: RecomputedTrainingLoad[] = [];
  for (const session of useSessionsStore.getState().sessions) {
    if (!scoresFromPower(session)) continue;
    const stress = sessionStressAt(session, profile);
    if (stress.stressMethod !== 'tss') continue;
    const change = changedLoad(session, stress);
    if (change) changes.push(change);
  }
  return changes;
};

const applyChanges = async (changes: RecomputedTrainingLoad[]): Promise<void> => {
  for (let start = 0; start < changes.length; start += REPROCESS_BATCH_SIZE) {
    const batch = changes.slice(start, start + REPROCESS_BATCH_SIZE);
    useSessionsStore.getState().applyRecomputedTrainingLoad(batch);
    for (let i = 0; i < batch.length; i++) useImportProgressStore.getState().advanceImport();
    await guardedSessionsStorage.flush();
  }
};

const hrScoredSessions = (): TrainingSession[] =>
  useSessionsStore.getState().sessions.filter((session) => session.stressMethod === 'trimp');

/** HR path: re-scores every HR-scored session from its records. */
const recomputeHrLoads = async (profile: UserProfile): Promise<number> => {
  const hrScored = hrScoredSessions();
  useImportProgressStore.getState().setImportTotal(hrScored.length);
  let changed = 0;
  for (let start = 0; start < hrScored.length; start += REPROCESS_BATCH_SIZE) {
    const changes: RecomputedTrainingLoad[] = [];
    for (const session of hrScored.slice(start, start + REPROCESS_BATCH_SIZE)) {
      const records = await getSessionRecords(session.id);
      const change = changedLoad(session, sessionStressFromRecordsAt(session, records, profile));
      if (change) changes.push(change);
      useImportProgressStore.getState().advanceImport();
    }
    useSessionsStore.getState().applyRecomputedTrainingLoad(changes);
    await guardedSessionsStorage.flush();
    changed += changes.length;
  }
  return changed;
};

const withOverlay = async <T>(run: () => Promise<T>): Promise<T> => {
  useImportProgressStore.getState().beginReprocessing();
  try {
    return await run();
  } finally {
    useImportProgressStore.getState().finishReprocessing();
  }
};

const runWithLock = async (): Promise<number> => {
  await useSessionsStore.persist.rehydrate();
  const profile = useUserStore.getState().profile;
  if (profile === null) return 0;

  const hrSignature = trainingLoadHrSignature(profile);
  let hrStale = useSessionsStore.getState().appliedHrSignature !== hrSignature;
  const fromPower = powerChanges(profile);
  if (hrStale && fromPower.length === 0 && hrScoredSessions().length === 0) {
    useSessionsStore.getState().setAppliedHrSignature(hrSignature);
    await guardedSessionsStorage.flush();
    hrStale = false;
  }
  if (!hrStale && fromPower.length === 0) return 0;

  return withOverlay(async () => {
    let changed = 0;
    if (fromPower.length > 0) {
      useImportProgressStore.getState().setImportTotal(fromPower.length);
      await applyChanges(fromPower);
      changed += fromPower.length;
    }
    if (hrStale) {
      changed += await recomputeHrLoads(profile);
      useSessionsStore.getState().setAppliedHrSignature(hrSignature);
      await guardedSessionsStorage.flush();
    }
    return changed;
  });
};

/**
 * Brings every session's stored training load in line with the current profile's thresholds.
 * Rides with a stored NP are re-scored from it (TSS) on every run, without reading records.
 * When rest, max or threshold HR or gender changed since the stored HR loads were computed,
 * the HR-scored sessions are re-scored from their records, and the applied HR values are
 * stored once that succeeded, so an interrupted run is redone on the next start.
 * Shows the reprocess overlay only when something is recomputed.
 * @returns The number of sessions whose load changed.
 */
export const recomputeTrainingLoad = (): Promise<number> => {
  return withExclusiveLock(SESSION_REPROCESSING_LOCK, runWithLock);
};
