import { describe, it, expect, vi } from 'vite-plus/test';
import { z } from 'zod';
import { recomputeTrainingLoad } from '@/lib/analysis/recomputeTrainingLoad.ts';
import { guardedSessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { idbStorage, bulkSaveSessionData } from '@/lib/storage/db.ts';
import {
  sessionStressAt,
  sessionStressFromRecordsAt,
  trainingLoadHrSignature,
} from '@/lib/analysis/sessionStress.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { runningRecordSeries } from '@pacevault/testing/series.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

const recordReads = vi.hoisted(() => ({ allowed: false, ids: [] as string[] }));

vi.mock('@/lib/storage/db.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/storage/db.ts')>();
  return {
    ...original,
    getSessionRecords: (sessionId: string) => {
      if (!recordReads.allowed) throw new Error('This recompute must not read records');
      recordReads.ids.push(sessionId);
      return original.getSessionRecords(sessionId);
    },
  };
});

const persistedSessionsSchema = z.object({
  state: z.object({
    sessions: z.array(z.looseObject({ id: z.string(), tss: z.number(), stressMethod: z.string() })),
    appliedHrSignature: z.string().nullable(),
  }),
});

const persistedState = async () => {
  const raw = await idbStorage.getItem('store-sessions');
  return persistedSessionsSchema.parse(JSON.parse(raw ?? '{}')).state;
};

const persistedSessions = async () => (await persistedState()).sessions;

describe(recomputeTrainingLoad.name, () => {
  it('switches a TRIMP ride to TSS once an FTP is added and leaves the run untouched', async () => {
    const profile = createMockUserProfile({
      thresholds: { restHr: [{ date: 0, value: 50 }], maxHr: [{ date: 0, value: 190 }] },
    });
    useUserStore.setState({ profile });
    useSessionReprocessingStore.setState({ phase: 'done' });
    const date = Date.now() - 30 * MS_PER_DAY;
    const rideFields = { sport: 'cycling' as const, date, duration: 3600, avgHr: 150 };
    const runFields = { sport: 'running' as const, date, duration: 2400, avgHr: 155 };
    const ride = { ...rideFields, normalizedPower: 200 };
    const run = { ...runFields, normalizedPower: undefined };
    const rideTrimp = sessionStressAt({ session: ride, profile });
    const runTrimp = sessionStressAt({ session: run, profile });
    recordReads.allowed = false;
    useSessionsStore.setState({
      sessions: [
        createMockTrainingSession({ id: 'ride', ...ride, ...rideTrimp, isNew: false }),
        createMockTrainingSession({ id: 'run', ...run, ...runTrimp, isNew: true }),
      ],
      appliedHrSignature: trainingLoadHrSignature(profile),
    });
    await guardedSessionsStorage.flush();

    useUserStore.getState().saveTodaysThresholds({ ftp: 250 });
    const changed = await recomputeTrainingLoad();

    // TSS = 3600 s × 200 W × (200 / 250) / (250 W × 3600) × 100 = 64
    const storedRide = useSessionsStore.getState().sessions.find((s) => s.id === 'ride');
    const storedRun = useSessionsStore.getState().sessions.find((s) => s.id === 'run');
    expect(rideTrimp.stressMethod).toBe('trimp');
    expect(changed).toBe(1);
    expect(storedRide).toMatchObject({ tss: 64, stressMethod: 'tss', normalizedPower: 200 });
    expect(storedRun).toMatchObject({ tss: runTrimp.tss, stressMethod: 'trimp', isNew: true });
    expect(await persistedSessions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'ride', tss: 64, stressMethod: 'tss' }),
        expect.objectContaining({ id: 'run', tss: runTrimp.tss, isNew: true }),
      ]),
    );
  });

  it('re-scores HR loads from the records after a threshold HR change and keeps ride TSS', async () => {
    const profile = createMockUserProfile();
    useUserStore.setState({ profile });
    useSessionReprocessingStore.setState({ phase: 'done' });
    const date = Date.now() - 30 * MS_PER_DAY;
    const records = runningRecordSeries({ count: 1800, baseHrBpm: 160 });
    await bulkSaveSessionData([{ sessionId: 'run', records, laps: [] }]);
    const run = createMockTrainingSession({
      id: 'run',
      sport: 'running',
      date,
      duration: 1800,
      avgHr: 160,
    });
    const runBefore = sessionStressFromRecordsAt({ session: run, records, profile });
    const ride = createMockTrainingSession({
      id: 'ride',
      sport: 'cycling',
      date,
      normalizedPower: 200,
    });
    const rideTss = sessionStressAt({ session: ride, profile });
    useSessionsStore.setState({
      sessions: [
        { ...run, ...runBefore },
        { ...ride, ...rideTss },
      ],
      appliedHrSignature: trainingLoadHrSignature(profile),
    });
    await guardedSessionsStorage.flush();
    recordReads.allowed = true;
    recordReads.ids = [];

    useUserStore.getState().saveTodaysThresholds({ thresholdHr: 160 });
    const changed = await recomputeTrainingLoad();

    const updated = useUserStore.getState().profile;
    if (!updated) throw new Error('profile missing');
    const runAfter = sessionStressFromRecordsAt({ session: run, records, profile: updated });
    expect(changed).toBe(1);
    expect(recordReads.ids).toEqual(['run']);
    expect(runAfter.tss).not.toBe(runBefore.tss);
    expect(await persistedState()).toMatchObject({
      appliedHrSignature: trainingLoadHrSignature(updated),
      sessions: expect.arrayContaining([
        expect.objectContaining({ id: 'run', tss: runAfter.tss, stressMethod: 'trimp' }),
        expect.objectContaining({ id: 'ride', tss: rideTss.tss, stressMethod: 'tss' }),
      ]),
    });
  });
});
