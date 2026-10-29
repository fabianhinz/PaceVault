import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { beforeEach, afterEach, vi } from 'vite-plus/test';
import type { StoreApi } from 'zustand';
import { INITIAL_USER_STORE_STATE, useUserStore } from '@/store/user.ts';
import { INITIAL_SESSIONS_STORE_STATE, useSessionsStore } from '@/store/sessions.ts';
import { INITIAL_COACH_PLAN_STORE_STATE, useCoachPlanStore } from '@/store/coachPlan.ts';
import { INITIAL_INTERVALS_STORE_STATE, useIntervalsStore } from '@/store/intervals.ts';
import {
  INITIAL_MAP_PREFERENCES_STORE_STATE,
  useMapPreferencesStore,
} from '@/store/mapPreferences.ts';
import {
  INITIAL_IMPORT_PROGRESS_STORE_STATE,
  useImportProgressStore,
} from '@/store/importProgress.ts';
import {
  INITIAL_SESSION_REPROCESSING_STORE_STATE,
  useSessionReprocessingStore,
} from '@/store/sessionReprocessing.ts';
import { resetDBInstance } from '@/lib/storage/db.ts';
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

  resetStateKeepingActions(useUserStore, INITIAL_USER_STORE_STATE);
  resetStateKeepingActions(useSessionsStore, INITIAL_SESSIONS_STORE_STATE);
  resetStateKeepingActions(useCoachPlanStore, INITIAL_COACH_PLAN_STORE_STATE);
  resetStateKeepingActions(useIntervalsStore, INITIAL_INTERVALS_STORE_STATE);
  resetStateKeepingActions(useMapPreferencesStore, INITIAL_MAP_PREFERENCES_STORE_STATE);
  resetStateKeepingActions(useImportProgressStore, INITIAL_IMPORT_PROGRESS_STORE_STATE);
  resetStateKeepingActions(useSessionReprocessingStore, INITIAL_SESSION_REPROCESSING_STORE_STATE);
});

afterEach(() => {
  vi.useRealTimers();
});
