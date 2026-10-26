import { describe, it, expect, vi } from 'vite-plus/test';
import { readE2eFixture } from '@testUtils/fixtures.ts';
import {
  REPROCESS_BATCH_SIZE,
  reprocessOutdatedSessions,
} from '@/features/sessions/reprocessSessions.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { guardedSessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { bulkSaveSessionData, getSessionGPS, getSessionRecords, saveSessionGPS } from '@/lib/db.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import { gradeAdjustedPaceFromRecords } from '@pacevault/engine/normalizedEffort.ts';
import {
  SESSION_DERIVATION_VERSION,
  deriveAvgFromRecords,
  deriveMaxFromRecords,
  isSessionOutdated,
} from '@pacevault/engine/sessionDerivation.ts';
import { stressFromRecords } from '@pacevault/engine/stress.ts';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';
import { lapSeries, runningRecordSeries } from '@pacevault/testing/series.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

const hang = vi.hoisted(() => ({ sessionId: null as string | null }));
const broken = vi.hoisted(() => ({ sessionId: null as string | null }));

vi.mock('@/lib/db.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/db.ts')>();
  return {
    ...original,
    getSessionRecords: (sessionId: string) => {
      if (sessionId === hang.sessionId) return new Promise<never>(() => undefined);
      if (sessionId === broken.sessionId) throw new Error('IndexedDB read failed');
      return original.getSessionRecords(sessionId);
    },
    getFitFile: async (sessionId: string) => {
      const file = await original.getFitFile(sessionId);
      if (!file) return undefined;
      return { ...file, data: Uint8Array.from(new Uint8Array(file.data)).buffer };
    },
  };
});

const outdatedSession = (overrides: Partial<TrainingSession>): TrainingSession => {
  return createMockTrainingSession({ sport: 'running', derivationVersion: 0, ...overrides });
};

const storeSessions = async (sessions: TrainingSession[]) => {
  useSessionReprocessingStore.setState({ phase: 'running' });
  useSessionsStore.setState({ sessions });
  await guardedSessionsStorage.flush();
  useSessionReprocessingStore.setState({ phase: 'pending' });
};

const smartRecordingPowerRecords = (): SessionRecord[] => {
  const records: SessionRecord[] = [];
  let t = 0;
  for (let i = 0; i < 900; i++) {
    t += 1 + (i % 4);
    records.push({ timestamp: t, timerTime: t, power: 150 + ((i * 37) % 200), hr: 140 });
  }
  return records;
};

const sessionById = (id: string): TrainingSession | undefined => {
  return useSessionsStore.getState().sessions.find((s) => s.id === id);
};

describe(reprocessOutdatedSessions.name, () => {
  it("updates an outdated session from its FIT file, takes the profile's load and keeps its intervals.icu name", async () => {
    const profile = createMockUserProfile();
    useUserStore.setState({ profile });
    const fit = readE2eFixture('running.fit');
    const fresh = await parseFitFile({
      arrayBuffer: fit.slice(0),
      fileName: 'run.fit',
      profileAt: toFitParseProfile(profile),
    });

    await bulkSaveSessionData([
      { sessionId: 'fit', records: [], laps: [], fit: { fileName: 'run.fit', data: fit } },
    ]);
    await saveSessionGPS({
      sessionId: 'fit',
      encodedPolyline: 'stale',
      pointCount: 1,
      bounds: { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 },
    });
    await storeSessions([
      outdatedSession({
        id: 'fit',
        name: 'Karlsruhe Laufen',
        gap: 999,
        avgCadence: 1,
        tss: 42,
        stressMethod: 'duration',
        isNew: false,
        source: { kind: 'intervals', activityId: 'i7' },
      }),
    ]);

    await reprocessOutdatedSessions();

    expect(sessionById('fit')).toMatchObject({
      name: 'Karlsruhe Laufen',
      gap: fresh.session.gap,
      avgCadence: fresh.session.avgCadence,
      distance: fresh.session.distance,
      tss: fresh.session.tss,
      stressMethod: fresh.session.stressMethod,
      isNew: false,
      source: { kind: 'intervals', activityId: 'i7' },
      derivationVersion: SESSION_DERIVATION_VERSION,
    });
    expect(await getSessionRecords('fit')).toHaveLength(fresh.records.length);
    expect(await getSessionGPS('fit')).toBeUndefined();
  });

  it('reprocessing resets a renamed session to its source name', async () => {
    useUserStore.setState({ profile: createMockUserProfile() });
    const fileName = '20240512_Morning_Run.fit';
    await bulkSaveSessionData([
      {
        sessionId: 'file',
        records: [],
        laps: [],
        fit: { fileName, data: readE2eFixture('running.fit') },
      },
    ]);
    await storeSessions([
      outdatedSession({ id: 'file', name: 'Renamed run', source: { kind: 'file' } }),
    ]);

    await reprocessOutdatedSessions();

    expect(sessionById('file')?.name).toBe('Morning Run');
  });

  it('reprocessing keeps the stored name when the file name yields none', async () => {
    useUserStore.setState({ profile: createMockUserProfile() });
    await bulkSaveSessionData([
      {
        sessionId: 'file',
        records: [],
        laps: [],
        fit: { fileName: 'activity.fit', data: readE2eFixture('running.fit') },
      },
    ]);
    await storeSessions([
      outdatedSession({ id: 'file', name: 'Morning Run', source: { kind: 'file' } }),
    ]);

    await reprocessOutdatedSessions();

    expect(sessionById('file')?.name).toBe('Morning Run');
  });

  it('recomputes a run without a stored FIT file from its records, its load from heart rate', async () => {
    useUserStore.setState({ profile: createMockUserProfile() });
    const records = runningRecordSeries({ count: 600 });
    const laps = lapSeries(2);
    await bulkSaveSessionData([{ sessionId: 'demo', records, laps }]);
    const stored = outdatedSession({
      id: 'demo',
      gap: 999,
      distance: 1,
      tss: 55,
      avgHr: undefined,
      maxHr: undefined,
      source: { kind: 'demo' },
    });
    await storeSessions([stored]);

    await reprocessOutdatedSessions();

    const derivedAvgHr = deriveAvgFromRecords({ records, field: 'hr' });
    const expected = stressFromRecords({
      sport: 'running',
      records,
      summary: { durationSec: stored.duration, avgHr: derivedAvgHr },
      thresholds: { restHr: 50, maxHr: 190, gender: 'male', ftp: 250 },
    });
    expect(derivedAvgHr).toBeDefined();
    expect(sessionById('demo')).toMatchObject({
      gap: gradeAdjustedPaceFromRecords({ records }),
      distance: records.at(-1)?.distance,
      avgHr: derivedAvgHr,
      maxHr: deriveMaxFromRecords({ records, field: 'hr' }),
      // A run never scores TSS, even with a stored NP and an FTP
      tss: expected.tss,
      stressMethod: 'trimp',
      derivationVersion: SESSION_DERIVATION_VERSION,
    });
  });

  it('a session whose FIT fails to parse is recomputed from its records', async () => {
    useUserStore.setState({ profile: createMockUserProfile() });
    const records = runningRecordSeries({ count: 600 });
    await bulkSaveSessionData([
      {
        sessionId: 'corrupt',
        records,
        laps: [],
        fit: { fileName: 'corrupt.fit', data: new Uint8Array([1, 2, 3, 4]).buffer },
      },
    ]);
    await storeSessions([outdatedSession({ id: 'corrupt', gap: 999, distance: 1 })]);

    await reprocessOutdatedSessions();

    expect(sessionById('corrupt')).toMatchObject({
      gap: gradeAdjustedPaceFromRecords({ records }),
      distance: records.at(-1)?.distance,
      derivationVersion: SESSION_DERIVATION_VERSION,
    });
  });

  it('a session that fails to reprocess is kept and not retried', async () => {
    const records = runningRecordSeries({ count: 300 });
    await bulkSaveSessionData([
      { sessionId: 'ok', records, laps: [] },
      { sessionId: 'failing', records, laps: [] },
    ]);
    await storeSessions([
      outdatedSession({ id: 'ok', gap: 999 }),
      outdatedSession({ id: 'failing', gap: 999 }),
    ]);

    broken.sessionId = 'failing';
    await reprocessOutdatedSessions();
    broken.sessionId = null;

    expect(sessionById('ok')?.gap).toBe(gradeAdjustedPaceFromRecords({ records }));
    expect(sessionById('failing')).toMatchObject({
      gap: 999,
      derivationVersion: SESSION_DERIVATION_VERSION,
    });
  });

  it('commits reprocessed sessions to the store once per batch', async () => {
    const ids = Array.from({ length: REPROCESS_BATCH_SIZE + 2 }, (_, i) => `s${i}`);
    const records = runningRecordSeries({ count: 60 });
    await bulkSaveSessionData(ids.map((id) => ({ sessionId: id, records, laps: [] })));
    await storeSessions(ids.map((id) => outdatedSession({ id })));

    const currentCounts: number[] = [];
    const unsubscribe = useSessionsStore.subscribe((state) => {
      currentCounts.push(state.sessions.filter((s) => !isSessionOutdated(s)).length);
    });
    await reprocessOutdatedSessions();
    unsubscribe();

    expect(currentCounts.filter((count) => count > 0)).toEqual([REPROCESS_BATCH_SIZE, ids.length]);
  });

  it('an interrupted run resumes after the last committed batch', async () => {
    const ids = Array.from({ length: REPROCESS_BATCH_SIZE + 2 }, (_, i) => `s${i}`);
    const records = runningRecordSeries({ count: 60 });
    await bulkSaveSessionData(ids.map((id) => ({ sessionId: id, records, laps: [] })));
    await storeSessions(ids.map((id) => outdatedSession({ id, gap: 999 })));

    hang.sessionId = ids.at(-1) ?? null;
    void reprocessOutdatedSessions();
    await vi.waitFor(() => expect(sessionById('s0')?.gap).not.toBe(999));
    await guardedSessionsStorage.flush();

    hang.sessionId = null;
    useSessionReprocessingStore.setState({ phase: 'pending' });
    await useSessionsStore.persist.rehydrate();
    const versions = useSessionsStore.getState().sessions.map((s) => s.derivationVersion);
    expect(versions.filter((v) => v === SESSION_DERIVATION_VERSION)).toHaveLength(
      REPROCESS_BATCH_SIZE,
    );

    await reprocessOutdatedSessions();

    const expectedGap = gradeAdjustedPaceFromRecords({ records });
    expect(useSessionsStore.getState().sessions.map((s) => [s.gap, s.derivationVersion])).toEqual(
      ids.map(() => [expectedGap, SESSION_DERIVATION_VERSION]),
    );
  });

  it('reprocessing a run from its FIT scores it from heart rate, not TSS', async () => {
    const fit = readE2eFixture('running.fit');
    const sessionDate = (
      await parseFitFile({
        arrayBuffer: fit.slice(0),
        fileName: 'run.fit',
        profileAt: () => ({
          restHr: 50,
          maxHr: 190,
          gender: 'male',
        }),
      })
    ).session.date;
    const profile = createMockUserProfile({
      thresholds: {
        restHr: [{ date: 0, value: 50 }],
        maxHr: [{ date: 0, value: 190 }],
        ftp: [
          { date: 0, value: 250 },
          { date: sessionDate + MS_PER_DAY, value: 400 },
        ],
      },
    });
    useUserStore.setState({ profile });
    const fresh = await parseFitFile({
      arrayBuffer: fit.slice(0),
      fileName: 'run.fit',
      profileAt: () => ({
        restHr: 50,
        maxHr: 190,
        gender: 'male',
        ftp: 250,
      }),
    });
    await bulkSaveSessionData([
      { sessionId: 'tss', records: [], laps: [], fit: { fileName: 'run.fit', data: fit } },
    ]);
    await storeSessions([
      outdatedSession({ id: 'tss', tss: 1, normalizedPower: 1, stressMethod: 'tss' }),
    ]);

    await reprocessOutdatedSessions();

    expect(fresh.session.stressMethod).toBe('trimp');
    expect(sessionById('tss')).toMatchObject({
      tss: fresh.session.tss,
      normalizedPower: fresh.session.normalizedPower,
      stressMethod: 'trimp',
    });
  });

  it('reprocessing a TSS ride without a stored FIT recomputes NP and TSS from its records', async () => {
    const profile = createMockUserProfile();
    useUserStore.setState({ profile });
    const records = smartRecordingPowerRecords();
    await bulkSaveSessionData([{ sessionId: 'ride', records, laps: [] }]);
    const stored = outdatedSession({
      id: 'ride',
      sport: 'cycling',
      tss: 1,
      normalizedPower: 1,
      stressMethod: 'tss',
      source: { kind: 'demo' },
    });
    await storeSessions([stored]);
    const expected = stressFromRecords({
      sport: 'cycling',
      records,
      summary: { durationSec: stored.duration, avgHr: stored.avgHr },
      thresholds: { restHr: 50, maxHr: 190, gender: 'male', ftp: 250 },
    });

    await reprocessOutdatedSessions();

    expect(expected.stressMethod).toBe('tss');
    expect(sessionById('ride')).toMatchObject({
      tss: expected.tss,
      normalizedPower: expected.normalizedPower,
      stressMethod: 'tss',
    });
  });

  it('a TSS ride falls back to TRIMP when the profile has no FTP', async () => {
    useUserStore.setState({
      profile: createMockUserProfile({
        thresholds: { restHr: [{ date: 0, value: 50 }], maxHr: [{ date: 0, value: 190 }] },
      }),
    });
    const records = smartRecordingPowerRecords();
    await bulkSaveSessionData([{ sessionId: 'ride', records, laps: [] }]);
    const stored = outdatedSession({
      id: 'ride',
      sport: 'cycling',
      tss: 80,
      normalizedPower: 215,
      stressMethod: 'tss',
      source: { kind: 'demo' },
    });
    await storeSessions([stored]);
    const expected = stressFromRecords({
      sport: 'cycling',
      records,
      summary: { durationSec: stored.duration, avgHr: stored.avgHr },
      thresholds: { restHr: 50, maxHr: 190, gender: 'male' },
    });

    await reprocessOutdatedSessions();

    expect(expected.stressMethod).toBe('trimp');
    expect(sessionById('ride')).toMatchObject({
      tss: expected.tss,
      normalizedPower: expected.normalizedPower,
      stressMethod: 'trimp',
    });
  });
});
