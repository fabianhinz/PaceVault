import type { SessionFields, SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import type { UserProfile } from '@/types/index.ts';
import {
  SESSION_DERIVATION_VERSION,
  deriveSessionFieldsFromRecords,
  isSessionOutdated,
} from '@pacevault/engine/sessionDerivation.ts';
import { parseFitFile, type ParsedFitResult } from '@/parsers/fit.ts';
import { calculateNormalizedPower } from '@pacevault/engine/normalize.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import { sessionStressAt, type StoredSessionStress } from '@/lib/sessionStress.ts';
import { bulkReplaceSessionData, getFitFile, getSessionRecords } from '@/lib/indexeddb.ts';
import { claimSessionsDerivationVersion } from '@/lib/guardedSessionsStorage.ts';
import { withExclusiveLock } from '@/lib/webLock.ts';
import { guardedSessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { INGEST_BATCH_SIZE, INGEST_CHUNK_SIZE } from './createIngestBatcher.ts';

export const SESSION_REPROCESSING_LOCK = 'pacevault-session-reprocessing';

export const REPROCESS_BATCH_SIZE = INGEST_BATCH_SIZE;

interface ReparsedSession {
  stored: TrainingSession;
  merged: TrainingSession;
  parsed: ParsedFitResult;
}

type ReprocessOutcome =
  | { kind: 'reparsed'; reparsed: ReparsedSession }
  | { kind: 'updated'; session: TrainingSession };

const markedCurrent = (session: TrainingSession): TrainingSession => {
  return { ...session, derivationVersion: SESSION_DERIVATION_VERSION };
};

const mergeReparsedSession = (
  stored: TrainingSession,
  reparsed: SessionFields,
): TrainingSession => {
  const merged: TrainingSession = {
    ...reparsed,
    id: stored.id,
    createdAt: stored.createdAt,
    isNew: stored.isNew,
    source: stored.source,
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

const recomputedStress = (
  session: TrainingSession,
  records: SessionRecord[],
  profile: UserProfile | null,
): StoredSessionStress => {
  if (profile === null) {
    return {
      tss: session.tss,
      stressMethod: session.stressMethod,
      normalizedPower: session.normalizedPower,
    };
  }
  const normalizedPower = calculateNormalizedPower(records) ?? session.normalizedPower;
  return sessionStressAt({ ...session, normalizedPower }, profile);
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
): Promise<ReprocessOutcome> => {
  const parsed = await reparseFit(session, profile);
  if (!parsed) return { kind: 'updated', session: await recomputeFromRecords(session, profile) };
  const merged = mergeReparsedSession(session, parsed.session);
  return { kind: 'reparsed', reparsed: { stored: session, merged, parsed } };
};

const reprocessOrKeep = async (
  session: TrainingSession,
  profile: UserProfile | null,
): Promise<ReprocessOutcome> => {
  try {
    return await reprocessSession(session, profile);
  } catch (err) {
    console.error(`Reprocessing session ${session.id} failed:`, err);
    return { kind: 'updated', session: markedCurrent(session) };
  }
};

const saveReparsedSessions = async (reparsed: ReparsedSession[]): Promise<TrainingSession[]> => {
  const entries = reparsed.map((item) => {
    let laps = item.parsed.laps;
    if (item.parsed.records.length === 0) laps = [];
    return { sessionId: item.stored.id, records: item.parsed.records, laps };
  });
  try {
    await bulkReplaceSessionData(entries);
    return reparsed.map((item) => item.merged);
  } catch (err) {
    console.error('Saving reprocessed session data failed:', err);
    return reparsed.map((item) => markedCurrent(item.stored));
  }
};

const reprocessBatch = async (
  ids: string[],
  profile: UserProfile | null,
): Promise<TrainingSession[]> => {
  const storedById = new Map(useSessionsStore.getState().sessions.map((s) => [s.id, s]));
  const updated: TrainingSession[] = [];
  let pending: ReparsedSession[] = [];

  const savePending = async () => {
    if (pending.length === 0) return;
    const chunk = pending;
    pending = [];
    updated.push(...(await saveReparsedSessions(chunk)));
  };

  for (const id of ids) {
    const session = storedById.get(id);
    if (session) {
      const outcome = await reprocessOrKeep(session, profile);
      if (outcome.kind === 'reparsed') pending.push(outcome.reparsed);
      else updated.push(outcome.session);
      if (pending.length >= INGEST_CHUNK_SIZE) await savePending();
    }
    useImportProgressStore.getState().advanceImport();
  }
  await savePending();
  return updated;
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

  for (let start = 0; start < outdatedIds.length; start += REPROCESS_BATCH_SIZE) {
    const batch = outdatedIds.slice(start, start + REPROCESS_BATCH_SIZE);
    const updated = await reprocessBatch(batch, profile);
    useSessionsStore.getState().commitReprocessedSessions(updated);
    await guardedSessionsStorage.flush();
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
