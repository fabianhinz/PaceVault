import 'fake-indexeddb/auto';
import { beforeEach, afterEach, vi } from 'vitest';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useImportProgressStore } from '@/store/importProgress.ts';
import { useSessionReprocessingStore } from '@/store/sessionReprocessing.ts';
import { resetDBInstance } from '@/lib/db.ts';
import { enableMapSet } from 'immer';

enableMapSet();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-02-11T00:00:00Z'));

  localStorage.clear();

  resetDBInstance();

  useUserStore.setState({ profile: null });
  useSessionsStore.setState({ sessions: [] });
  useCoachPlanStore.setState({ cachedPlan: null, cacheKey: null });
  useIntervalsStore.setState({
    apiKey: null,
    importedActivityIds: [],
    keyInvalid: false,
    backlogPending: false,
  });
  useImportProgressStore.setState({ runningImports: 0, foreground: null });
  useSessionReprocessingStore.setState({ phase: 'pending', newerVersionInOtherTab: false });
});

afterEach(() => {
  vi.useRealTimers();
});
