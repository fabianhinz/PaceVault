import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { reprocessOutdatedSessions } from '@/features/sessions/reprocessSessions.ts';
import { parseFitFile } from '@/parsers/fit.ts';
import { sessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { bulkSaveSessionData, getSessionRecords } from '@/lib/indexeddb.ts';
import { toFitParseProfile } from '@/lib/fitParseProfile.ts';
import { calculateGAP } from '@/packages/engine/normalize.ts';
import { SESSION_DERIVATION_VERSION } from '@/packages/engine/sessionDerivation.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';
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
  await sessionsStorage.flush();
  useSessionReprocessingStore.setState({ phase: 'pending' });
};

const sessionById = (id: string): TrainingSession | undefined => {
  return useSessionsStore.getState().sessions.find((s) => s.id === id);
};

describe('reprocessOutdatedSessions', () => {
  it('updates an outdated session from its FIT file and keeps its TSS', async () => {
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
        movingTime: 1,
        tss: 55,
        source: { kind: 'demo' },
      }),
    ]);

    await reprocessOutdatedSessions();

    expect(sessionById('demo')).toMatchObject({
      gap: calculateGAP(records),
      distance: records.at(-1)?.distance,
      movingTime: 580,
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
    await sessionsStorage.flush();

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
});
