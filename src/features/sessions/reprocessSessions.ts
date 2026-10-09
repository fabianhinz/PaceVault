import type { SessionFields, TrainingSession } from '@/packages/engine/types.ts';
import type { UserProfile } from '@/types/index.ts';
import {
  SESSION_DERIVATION_VERSION,
  deriveMovingTimeFromLaps,
  deriveSessionFieldsFromRecords,
  isSessionOutdated,
} from '@/packages/engine/sessionDerivation.ts';
import { parseFitFile, type ParsedFitResult } from '@/parsers/fit.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import {
  deleteSessionGPS,
  deleteSessionLaps,
  deleteSessionRecords,
  getFitFile,
  getSessionLaps,
  getSessionRecords,
  saveSessionLaps,
  saveSessionRecords,
} from '@/lib/indexeddb.ts';
import { claimSessionsDerivationVersion } from '@/lib/sessionsStorage.ts';
import { withExclusiveLock } from '@/lib/webLock.ts';
import { sessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';

const SESSION_REPROCESSING_LOCK = 'pacevault-session-reprocessing';

const mergeReparsedSession = (
  stored: TrainingSession,
  reparsed: SessionFields,
): TrainingSession => {
  return {
    ...reparsed,
    id: stored.id,
    createdAt: stored.createdAt,
    isNew: stored.isNew,
    source: stored.source,
    name: stored.name ?? reparsed.name,
    tss: stored.tss,
    stressMethod: stored.stressMethod,
    derivationVersion: SESSION_DERIVATION_VERSION,
  };
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

const recomputeFromRecords = async (session: TrainingSession): Promise<TrainingSession> => {
  const records = await getSessionRecords(session.id);
  const laps = await getSessionLaps(session.id);
  const derived = deriveSessionFieldsFromRecords(session.sport, records);

  let gap = session.gap;
  if (session.sport === 'running') gap = derived.gap;

  return {
    ...session,
    distance: derived.distance ?? session.distance,
    avgPower: derived.avgPower ?? session.avgPower,
    maxPower: derived.maxPower ?? session.maxPower,
    avgCadence: derived.avgCadence ?? session.avgCadence,
    maxSpeed: session.maxSpeed ?? derived.maxSpeed,
    movingTime: deriveMovingTimeFromLaps(laps) ?? session.movingTime,
    gap,
    derivationVersion: SESSION_DERIVATION_VERSION,
  };
};

const reprocessSession = async (
  session: TrainingSession,
  profile: UserProfile | null,
): Promise<TrainingSession> => {
  const parsed = await reparseFit(session, profile);
  if (!parsed) return recomputeFromRecords(session);
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
      await sessionsStorage.flush();
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
