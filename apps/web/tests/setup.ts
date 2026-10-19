import 'fake-indexeddb/auto';
import { beforeEach, afterEach, vi } from 'vite-plus/test';
import type { StoreApi } from 'zustand';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { resetDBInstance } from '@/lib/db.ts';
import { enableMapSet } from 'immer';

enableMapSet();

const resetStateKeepingActions = <T>(store: Pick<StoreApi<T>, 'setState'>, data: Partial<T>) => {
  store.setState(data, false);
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-02-11T00:00:00Z'));

  localStorage.clear();

  resetDBInstance();

  resetStateKeepingActions(useUserStore, { profile: null });
  resetStateKeepingActions(useSessionsStore, { sessions: [] });
  resetStateKeepingActions(useCoachPlanStore, { cachedPlan: null, cacheKey: null });
  resetStateKeepingActions(useIntervalsStore, {
    apiKey: null,
    importedActivityIds: [],
    keyInvalid: false,
    backlogPending: false,
  });
  resetStateKeepingActions(useMapPreferencesStore, {
    trackIntensity: 'warm',
    bySport: {
      running: { colorMode: 'sport', lapSource: 'splits', splitDistance: null },
      cycling: { colorMode: 'sport', lapSource: 'splits', splitDistance: null },
    },
  });
  resetStateKeepingActions(useImportProgressStore, {
    runningImports: 0,
    foreground: null,
    awaitingTrackBuild: false,
    mapCrashed: false,
  });
  resetStateKeepingActions(useSessionReprocessingStore, {
    phase: 'pending',
    newerVersionInOtherTab: false,
  });
});

afterEach(() => {
  vi.useRealTimers();
});
