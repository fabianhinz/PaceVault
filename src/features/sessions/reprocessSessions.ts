import type { SessionFields, SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import type { UserProfile } from '@/types/index.ts';
import {
  SESSION_DERIVATION_VERSION,
  deriveSessionFieldsFromRecords,
  isSessionOutdated,
} from '@/packages/engine/sessionDerivation.ts';
import { parseFitFile, type ParsedFitResult } from '@/parsers/fit.ts';
import { calculateSessionStress } from '@/packages/engine/stress.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';
import {
  deleteSessionGPS,
  deleteSessionLaps,
  deleteSessionRecords,
  getFitFile,
  getSessionRecords,
  saveSessionLaps,
  saveSessionRecords,
} from '@/lib/indexeddb.ts';
import { claimSessionsDerivationVersion } from '@/lib/guardedSessionsStorage.ts';
import { withExclusiveLock } from '@/lib/webLock.ts';
import { guardedSessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';

const SESSION_REPROCESSING_LOCK = 'pacevault-session-reprocessing';

const mergeReparsedSession = (
  stored: TrainingSession,
  reparsed: SessionFields,
): TrainingSession => {
  let tss = stored.tss;
  let stressMethod = stored.stressMethod;
  if (stored.stressMethod === 'tss' && reparsed.stressMethod === 'tss') {
    tss = reparsed.tss;
    stressMethod = reparsed.stressMethod;
  }
  const merged: TrainingSession = {
    ...reparsed,
    id: stored.id,
    createdAt: stored.createdAt,
    isNew: stored.isNew,
    source: stored.source,
    tss,
    stressMethod,
    derivationVersion: SESSION_DERIVATION_VERSION,
  };
  if (stored.source.kind === 'intervals' && stored.name !== undefined) merged.name = stored.name;
  if (merged.name === undefined && stored.name !== undefined) merged.name = stored.name;
  return merged;
};

const reparseFit = async (
  session: TrainingSession,
  profile: UserProfile | null,
): Promise<ParsedFitResult | undefined> => {
  if (profile === null) return undefined;
  const fit = await getFitFile(session.id);
  if (!fit) return undefined;
  try {
    return await parseFitFile(fit.data, fit.fileName, toFitParseProfile(profile));
  } catch (err) {
    console.error(`Reparsing the FIT file of session ${session.id} failed:`, err);
    return undefined;
  }
};

const replaceSessionData = async (sessionId: string, parsed: ParsedFitResult) => {
  let laps = parsed.laps;
  if (parsed.records.length === 0) laps = [];
  await deleteSessionRecords(sessionId);
  await deleteSessionLaps(sessionId);
  await deleteSessionGPS(sessionId);
  await saveSessionRecords(sessionId, parsed.records);
  await saveSessionLaps(sessionId, laps);
};

const recomputedStress = (
  session: TrainingSession,
  records: SessionRecord[],
  profile: UserProfile | null,
): Pick<TrainingSession, 'tss' | 'stressMethod' | 'normalizedPower'> => {
  const stored = {
    tss: session.tss,
    stressMethod: session.stressMethod,
    normalizedPower: session.normalizedPower,
  };
  if (profile === null || session.stressMethod !== 'tss') return stored;
  const thresholds = thresholdsAt(profile, session.date);
  if (thresholds.ftp === undefined || thresholds.ftp <= 0) return stored;
  const result = calculateSessionStress(
    records,
    session.duration,
    session.avgHr,
    thresholds.restHr,
    thresholds.maxHr,
    thresholds.gender,
    thresholds.ftp,
  );
  if (result.stressMethod !== 'tss') return stored;
  return {
    tss: result.tss,
    stressMethod: result.stressMethod,
    normalizedPower: result.normalizedPower,
  };
};

const recomputeFromRecords = async (
  session: TrainingSession,
  profile: UserProfile | null,
): Promise<TrainingSession> => {
  const records = await getSessionRecords(session.id);
  const derived = deriveSessionFieldsFromRecords(session.sport, records);

  let gap = session.gap;
  if (session.sport === 'running') gap = derived.gap;

  return {
    ...session,
    ...recomputedStress(session, records, profile),
    distance: derived.distance ?? session.distance,
    avgPower: derived.avgPower ?? session.avgPower,
    avgCadence: derived.avgCadence ?? session.avgCadence,
    maxSpeed: session.maxSpeed ?? derived.maxSpeed,
    gap,
    derivationVersion: SESSION_DERIVATION_VERSION,
  };
};

const reprocessSession = async (
  session: TrainingSession,
  profile: UserProfile | null,
): Promise<TrainingSession> => {
  const parsed = await reparseFit(session, profile);
  if (!parsed) return recomputeFromRecords(session, profile);
  await replaceSessionData(session.id, parsed);
  return mergeReparsedSession(session, parsed.session);
};

const reprocessOrKeep = async (
  session: TrainingSession,
  profile: UserProfile | null,
): Promise<TrainingSession> => {
  try {
    return await reprocessSession(session, profile);
  } catch (err) {
    console.error(`Reprocessing session ${session.id} failed:`, err);
    return { ...session, derivationVersion: SESSION_DERIVATION_VERSION };
  }
};

const hasOutdatedSessions = (): boolean => {
  return useSessionsStore.getState().sessions.some(isSessionOutdated);
};

const runWithLock = async (): Promise<number> => {
  useSessionReprocessingStore.getState().setSessionReprocessingPhase('running');
  await useSessionsStore.persist.rehydrate();

  const claim = await claimSessionsDerivationVersion();
  if (claim === 'newer') {
    useSessionReprocessingStore.getState().markNewerVersionInOtherTab();
    return 0;
  }

  const outdatedIds = useSessionsStore
    .getState()
    .sessions.filter(isSessionOutdated)
    .map((session) => session.id);
  useImportProgressStore.getState().setImportTotal(outdatedIds.length);
  const profile = useUserStore.getState().profile;

  for (const id of outdatedIds) {
    const session = useSessionsStore.getState().sessions.find((s) => s.id === id);
    if (session) {
      const updated = await reprocessOrKeep(session, profile);
      useSessionsStore.getState().commitReprocessedSession(updated);
      await guardedSessionsStorage.flush();
    }
    useImportProgressStore.getState().advanceImport();
  }
  return outdatedIds.length;
};

export const reprocessOutdatedSessions = async (): Promise<number> => {
  if (!hasOutdatedSessions()) {
    const claim = await claimSessionsDerivationVersion();
    if (claim === 'newer') useSessionReprocessingStore.getState().markNewerVersionInOtherTab();
    useSessionReprocessingStore.getState().setSessionReprocessingPhase('done');
    return 0;
  }

  useSessionReprocessingStore.getState().setSessionReprocessingPhase('waiting');
  useImportProgressStore.getState().beginReprocessing();
  try {
    return await withExclusiveLock(SESSION_REPROCESSING_LOCK, runWithLock);
  } finally {
    useImportProgressStore.getState().finishReprocessing();
    useSessionReprocessingStore.getState().setSessionReprocessingPhase('done');
  }
};
