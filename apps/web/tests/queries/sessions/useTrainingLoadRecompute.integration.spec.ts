import { describe, it, expect } from 'vite-plus/test';
import { act, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { useTrainingLoadRecompute } from '@/queries/sessions/useTrainingLoadRecompute.ts';
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
import { renderHookWithProviders } from '@testUtils/render.ts';

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

describe(useTrainingLoadRecompute.name, () => {
  it('recomputes the training load again after the threshold HR changes', async () => {
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

    const view = renderHookWithProviders(() => useTrainingLoadRecompute());
    await waitFor(() => expect(view.result.current.isSuccess).toBe(true));

    act(() => useUserStore.getState().saveTodaysThresholds({ thresholdHr: 160 }));

    const updated = useUserStore.getState().profile;
    if (!updated) throw new Error('profile missing');
    const runAfter = sessionStressFromRecordsAt({ session: run, records, profile: updated });
    expect(runAfter.tss).not.toBe(runBefore.tss);
    await waitFor(async () => {
      expect(await persistedState()).toMatchObject({
        appliedHrSignature: trainingLoadHrSignature(updated),
        sessions: expect.arrayContaining([
          expect.objectContaining({ id: 'run', tss: runAfter.tss, stressMethod: 'trimp' }),
          expect.objectContaining({ id: 'ride', tss: rideTss.tss, stressMethod: 'tss' }),
        ]),
      });
    });
  });
});
