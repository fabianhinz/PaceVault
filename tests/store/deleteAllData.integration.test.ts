import { describe, it, expect } from 'vitest';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { createEmptyAttributeFilters } from '@/lib/attributeFilters.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';
import { makeCyclingRecords, makeLaps } from '@tests/factories/records.ts';
import {
  saveSessionRecords,
  getSessionRecords,
  clearAllRecords,
  saveSessionLaps,
  getSessionLaps,
} from '@/lib/indexeddb.ts';
import { idbStorage } from '@/lib/idbStorage.ts';

describe('delete all data', () => {
  it('clears sessions, profile, session-records, session-laps, and resets onboarding', async () => {
    const { createdAt: _ca, ...sessionData } = makeSession();
    useSessionsStore.getState().addSessions([sessionData]);
    const sessionId = sessionData.id;

    const { id: _pid, createdAt: _pca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);

    useLayoutStore.getState().completeOnboarding();

    const records = makeCyclingRecords(60, { basePower: 200 });
    await saveSessionRecords(sessionId, records);

    const laps = makeLaps(2);
    await saveSessionLaps(sessionId, laps);

    await idbStorage.setItem('store-user', '{"state":{"profile":{}}}');

    useCoachPlanStore
      .getState()
      .setPlan(
        { weekOf: '2026-02-09', workouts: [], totalEstimatedTss: 0, context: { mode: 'no-data' } },
        '2026-02-09:1:300',
      );

    useIntervalsStore.getState().connectIntervals('secret-key');
    useIntervalsStore.getState().recordIntervalsImported(['i1', 'i2']);

    useFiltersStore.setState({
      timeRange: '90d',
      sportFilter: 'cycling',
      attributeFilters: { duration: 3600, distance: 10000, elevationGain: 500 },
    });

    expect(useFiltersStore.getState().timeRange).toBe('90d');
    expect(useIntervalsStore.getState().apiKey).not.toBeNull();
    expect(useCoachPlanStore.getState().cachedPlan).not.toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(1);
    expect(useUserStore.getState().profile).not.toBeNull();
    expect(useLayoutStore.getState().onboardingComplete).toBe(true);
    expect(await getSessionRecords(sessionId)).toHaveLength(60);
    expect(await getSessionLaps(sessionId)).toHaveLength(2);
    expect(await idbStorage.getItem('store-user')).not.toBeNull();

    useSessionsStore.getState().clearAll();
    useUserStore.getState().resetProfile();
    useCoachPlanStore.getState().clearPlan();
    useIntervalsStore.getState().disconnectIntervals();
    useLayoutStore.setState({ onboardingComplete: false });
    useFiltersStore.setState({
      timeRange: 'all',
      customRange: null,
      prevDashboardRange: null,
      sportFilter: 'all',
      attributeFilters: createEmptyAttributeFilters(),
    });
    await clearAllRecords();

    expect(useCoachPlanStore.getState().cachedPlan).toBeNull();
    expect(useCoachPlanStore.getState().cacheKey).toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
    expect(await getSessionRecords(sessionId)).toHaveLength(0);
    expect(await getSessionLaps(sessionId)).toHaveLength(0);
    expect(await idbStorage.getItem('store-user')).toBeNull();

    expect(useIntervalsStore.getState().apiKey).toBeNull();
    expect(useIntervalsStore.getState().importedActivityIds).toEqual([]);
    expect(useUserStore.getState().profile).toBeNull();
    expect(useLayoutStore.getState().onboardingComplete).toBe(false);
    expect(useFiltersStore.getState().timeRange).toBe('all');
    expect(useFiltersStore.getState().sportFilter).toBe('all');
    expect(useFiltersStore.getState().attributeFilters).toEqual({
      duration: null,
      distance: null,
      elevationGain: null,
    });
  });
});
