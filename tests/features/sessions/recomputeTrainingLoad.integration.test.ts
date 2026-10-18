import { describe, it, expect, vi } from 'vite-plus/test';
import { z } from 'zod';
import { recomputeTrainingLoad } from '@/features/sessions/recomputeTrainingLoad.ts';
import { guardedSessionsStorage, useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { idbStorage } from '@/lib/idbStorage.ts';
import { sessionStressAt } from '@/lib/sessionStress.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';

vi.mock('@/lib/indexeddb.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/indexeddb.ts')>();
  return {
    ...original,
    getSessionRecords: () => {
      throw new Error('The training load recompute must not read records');
    },
  };
});

const DAY = 86_400_000;

const persistedSessionsSchema = z.object({
  state: z.object({
    sessions: z.array(z.looseObject({ id: z.string(), tss: z.number(), stressMethod: z.string() })),
  }),
});

const persistedSessions = async () => {
  const raw = await idbStorage.getItem('store-sessions');
  return persistedSessionsSchema.parse(JSON.parse(raw ?? '{}')).state.sessions;
};

describe('recomputeTrainingLoad', () => {
  it('switches a TRIMP ride to TSS once an FTP is added and leaves the run untouched', async () => {
    const profile = makeUserProfile({
      thresholds: { restHr: [{ date: 0, value: 50 }], maxHr: [{ date: 0, value: 190 }] },
    });
    useUserStore.setState({ profile });
    useSessionReprocessingStore.setState({ phase: 'done' });
    const date = Date.now() - 30 * DAY;
    const rideFields = { date, duration: 3600, avgHr: 150, normalizedPower: 200 };
    const runFields = { date, duration: 2400, avgHr: 155, normalizedPower: undefined };
    const rideTrimp = sessionStressAt(rideFields, profile);
    const runTrimp = sessionStressAt(runFields, profile);
    useSessionsStore.setState({
      sessions: [
        makeSession({ id: 'ride', sport: 'cycling', ...rideFields, ...rideTrimp, isNew: false }),
        makeSession({ id: 'run', sport: 'running', ...runFields, ...runTrimp, isNew: true }),
      ],
    });
    await guardedSessionsStorage.flush();

    useUserStore.getState().saveTodaysThresholds({ ftp: 250 });
    const changed = await recomputeTrainingLoad();

    // TSS = 3600 s × 200 W × (200 / 250) / (250 W × 3600) × 100 = 64
    const ride = useSessionsStore.getState().sessions.find((s) => s.id === 'ride');
    const run = useSessionsStore.getState().sessions.find((s) => s.id === 'run');
    expect(rideTrimp.stressMethod).toBe('trimp');
    expect(changed).toBe(1);
    expect(ride).toMatchObject({ tss: 64, stressMethod: 'tss', normalizedPower: 200 });
    expect(run).toMatchObject({ tss: runTrimp.tss, stressMethod: 'trimp', isNew: true });
    expect(await persistedSessions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'ride', tss: 64, stressMethod: 'tss' }),
        expect.objectContaining({ id: 'run', tss: runTrimp.tss, isNew: true }),
      ]),
    );
  });
});
