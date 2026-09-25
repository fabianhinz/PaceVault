import 'fake-indexeddb/auto';
import { beforeEach, afterEach, vi } from 'vitest';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { usePersonalBestsStore } from '@/store/personalBests.ts';
import { useIntervalsProgressStore } from '@/features/intervals/syncProgress.ts';
import { resetDBInstance } from '@/lib/db.ts';
import { enableMapSet } from 'immer';

enableMapSet();

beforeEach(() => {
  // Only fake Date (not setTimeout/setInterval) to avoid blocking async IndexedDB
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-02-11T00:00:00Z'));

  localStorage.clear();

  // Reset IDB singleton so each test gets a fresh connection
  resetDBInstance();

  // Reset Zustand stores (merge, not replace — keeps action methods)
  useUserStore.setState({ profile: null });
  useSessionsStore.setState({ sessions: [] });
  useCoachPlanStore.setState({ cachedPlan: null, cacheKey: null });
  usePersonalBestsStore.getState().clearPBs();
  useIntervalsStore.setState({
    apiKey: null,
    athleteFirstName: null,
    importedActivityIds: [],
    keyInvalid: false,
    backlogPending: false,
  });
  useIntervalsProgressStore.setState({ processed: 0, total: 0, foreground: false });
});

afterEach(() => {
  vi.useRealTimers();
});
