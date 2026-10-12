import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { reprocessOutdatedSessions } from '@/features/sessions/reprocessSessions.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { guardedSessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { bulkSaveSessionData, getSessionRecords } from '@/lib/indexeddb.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import { calculateGAP } from '@/packages/engine/normalize.ts';
import { SESSION_DERIVATION_VERSION } from '@/packages/engine/sessionDerivation.ts';
import { calculateSessionStress } from '@/packages/engine/stress.ts';
import type { SessionRecord, TrainingSession } from '@/packages/engine/types.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';
import { makeLaps, makeRunningRecords } from '@tests/factories/records.ts';

const hang = vi.hoisted(() => ({ sessionId: null as string | null }));

vi.mock('@/lib/indexeddb.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/indexeddb.ts')>();
  return {
    ...original,
    getSessionRecords: (sessionId: string) => {
      if (sessionId === hang.sessionId) return new Promise<never>(() => undefined);
      return original.getSessionRecords(sessionId);
    },
    getFitFile: async (sessionId: string) => {
      const file = await original.getFitFile(sessionId);
      if (!file) return undefined;
      return { ...file, data: Uint8Array.from(new Uint8Array(file.data)).buffer };
    },
  };
});

const runningFit = (): ArrayBuffer => {
  const buf = readFileSync(resolve('e2e/fixtures/running.fit'));
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(buf);
  return bytes.buffer;
};

const outdatedSession = (overrides: Partial<TrainingSession>): TrainingSession => {
  return makeSession({ sport: 'running', derivationVersion: 0, ...overrides });
};

const storeSessions = async (sessions: TrainingSession[]) => {
  useSessionReprocessingStore.setState({ phase: 'running' });
  useSessionsStore.setState({ sessions });
  await guardedSessionsStorage.flush();
  useSessionReprocessingStore.setState({ phase: 'pending' });
};

const DAY = 86_400_000;

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

describe('reprocessOutdatedSessions', () => {
  it('updates an outdated session from its FIT file and keeps its TSS and intervals.icu name', async () => {
    const profile = makeUserProfile();
    useUserStore.setState({ profile });
    const fit = runningFit();
    const fresh = await parseFitFile(fit.slice(0), 'run.fit', toFitParseProfile(profile));

    await bulkSaveSessionData([
      { sessionId: 'fit', records: [], laps: [], fit: { fileName: 'run.fit', data: fit } },
    ]);
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
      tss: 42,
      stressMethod: 'duration',
      isNew: false,
      source: { kind: 'intervals', activityId: 'i7' },
      derivationVersion: SESSION_DERIVATION_VERSION,
    });
    expect(await getSessionRecords('fit')).toHaveLength(fresh.records.length);
  });

  it('reprocessing resets a renamed session to its source name', async () => {
    useUserStore.setState({ profile: makeUserProfile() });
    const fileName = '20240512_Morning_Run.fit';
    await bulkSaveSessionData([
      { sessionId: 'file', records: [], laps: [], fit: { fileName, data: runningFit() } },
    ]);
    await storeSessions([
      outdatedSession({ id: 'file', name: 'Renamed run', source: { kind: 'file' } }),
    ]);

    await reprocessOutdatedSessions();

    expect(sessionById('file')?.name).toBe('Morning Run');
  });

  it('reprocessing keeps the stored name when the file name yields none', async () => {
    useUserStore.setState({ profile: makeUserProfile() });
    await bulkSaveSessionData([
      {
        sessionId: 'file',
        records: [],
        laps: [],
        fit: { fileName: 'activity.fit', data: runningFit() },
      },
    ]);
    await storeSessions([
      outdatedSession({ id: 'file', name: 'Morning Run', source: { kind: 'file' } }),
    ]);

    await reprocessOutdatedSessions();

    expect(sessionById('file')?.name).toBe('Morning Run');
  });

  it('recomputes a session without a stored FIT file from its records', async () => {
    useUserStore.setState({ profile: makeUserProfile() });
    const records = makeRunningRecords(600);
    const laps = makeLaps(2);
    await bulkSaveSessionData([{ sessionId: 'demo', records, laps }]);
    await storeSessions([
      outdatedSession({
        id: 'demo',
        gap: 999,
        distance: 1,
        tss: 55,
        source: { kind: 'demo' },
      }),
    ]);

    await reprocessOutdatedSessions();

    expect(sessionById('demo')).toMatchObject({
      gap: calculateGAP(records),
      distance: records.at(-1)?.distance,
      tss: 55,
      derivationVersion: SESSION_DERIVATION_VERSION,
    });
  });

  it('an interrupted run resumes with the remaining sessions', async () => {
    const ids = ['a', 'b', 'c'];
    const records = makeRunningRecords(300);
    await bulkSaveSessionData(ids.map((id) => ({ sessionId: id, records, laps: [] })));
    await storeSessions(ids.map((id) => outdatedSession({ id, gap: 999 })));

    hang.sessionId = 'b';
    void reprocessOutdatedSessions();
    await vi.waitFor(() => expect(sessionById('a')?.gap).not.toBe(999));
    await guardedSessionsStorage.flush();

    hang.sessionId = null;
    useSessionReprocessingStore.setState({ phase: 'pending' });
    await useSessionsStore.persist.rehydrate();
    expect(useSessionsStore.getState().sessions.map((s) => s.derivationVersion)).toEqual([
      SESSION_DERIVATION_VERSION,
      0,
      0,
    ]);

    await reprocessOutdatedSessions();

    const expectedGap = calculateGAP(records);
    expect(useSessionsStore.getState().sessions.map((s) => [s.gap, s.derivationVersion])).toEqual(
      ids.map(() => [expectedGap, SESSION_DERIVATION_VERSION]),
    );
  });

  it('reprocessing a TSS ride recomputes NP and TSS from its FIT', async () => {
    const fit = runningFit();
    const sessionDate = (
      await parseFitFile(fit.slice(0), 'run.fit', () => ({
        restHr: 50,
        maxHr: 190,
        gender: 'male',
      }))
    ).session.date;
    const profile = makeUserProfile({
      thresholds: {
        restHr: [{ date: 0, value: 50 }],
        maxHr: [{ date: 0, value: 190 }],
        ftp: [
          { date: 0, value: 250 },
          { date: sessionDate + DAY, value: 400 },
        ],
      },
    });
    useUserStore.setState({ profile });
    const fresh = await parseFitFile(fit.slice(0), 'run.fit', () => ({
      restHr: 50,
      maxHr: 190,
      gender: 'male',
      ftp: 250,
    }));
    await bulkSaveSessionData([
      { sessionId: 'tss', records: [], laps: [], fit: { fileName: 'run.fit', data: fit } },
    ]);
    await storeSessions([
      outdatedSession({ id: 'tss', tss: 1, normalizedPower: 1, stressMethod: 'tss' }),
    ]);

    await reprocessOutdatedSessions();

    expect(fresh.session.stressMethod).toBe('tss');
    expect(sessionById('tss')).toMatchObject({
      tss: fresh.session.tss,
      normalizedPower: fresh.session.normalizedPower,
      stressMethod: 'tss',
    });
  });

  it('reprocessing a TSS ride without a stored FIT recomputes NP and TSS from its records', async () => {
    const profile = makeUserProfile();
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
    const expected = calculateSessionStress(
      records,
      stored.duration,
      stored.avgHr,
      50,
      190,
      'male',
      250,
    );

    await reprocessOutdatedSessions();

    expect(expected.stressMethod).toBe('tss');
    expect(sessionById('ride')).toMatchObject({
      tss: expected.tss,
      normalizedPower: expected.normalizedPower,
      stressMethod: 'tss',
    });
  });

  it('a TSS ride keeps its stored TSS when the profile has no FTP', async () => {
    useUserStore.setState({
      profile: makeUserProfile({
        thresholds: { restHr: [{ date: 0, value: 50 }], maxHr: [{ date: 0, value: 190 }] },
      }),
    });
    await bulkSaveSessionData([
      { sessionId: 'ride', records: smartRecordingPowerRecords(), laps: [] },
    ]);
    await storeSessions([
      outdatedSession({
        id: 'ride',
        sport: 'cycling',
        tss: 80,
        normalizedPower: 215,
        stressMethod: 'tss',
        source: { kind: 'demo' },
      }),
    ]);

    await reprocessOutdatedSessions();

    expect(sessionById('ride')).toMatchObject({
      tss: 80,
      normalizedPower: 215,
      stressMethod: 'tss',
    });
  });
});
