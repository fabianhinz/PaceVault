import { describe, it, expect } from 'vite-plus/test';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { useCoachPlanStore } from '@/store/coachPlan.ts';
import { useLayoutStore } from '@/store/layout.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useMapPreferencesStore } from '@/store/mapPreferences.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';
import { cyclingRecordSeries, lapSeries } from '@pacevault/testing/series.ts';
import {
  getSessionRecords,
  clearAllRecords,
  getSessionLaps,
  bulkSaveSessionData,
  idbStorage,
} from '@/lib/storage/db.ts';

describe('delete all data', () => {
  it('clears sessions, profile, session-records, session-laps, and resets onboarding', async () => {
    const { createdAt: _ca, ...sessionData } = createMockTrainingSession();
    useSessionsStore.getState().addSessions({ sessions: [sessionData] });
    const sessionId = sessionData.id;

    const { id: _pid, createdAt: _pca, ...profileData } = createMockUserProfile();
    useUserStore.getState().setProfile(profileData);

    useLayoutStore.getState().completeOnboarding();

    const records = cyclingRecordSeries({ count: 60, basePowerWatts: 200 });
    const laps = lapSeries(2);
    await bulkSaveSessionData([{ sessionId, records, laps }]);

    await idbStorage.setItem('store-user', '{"state":{"profile":{}}}');

    useCoachPlanStore.getState().setPlan({
      plan: {
        weekOf: '2026-02-09',
        workouts: [],
        totalEstimatedTss: 0,
        context: { mode: 'no-data' },
      },
      key: '2026-02-09:1:300',
    });

    useIntervalsStore.getState().connectIntervals('secret-key');
    useIntervalsStore.getState().recordIntervalsImported(['i1', 'i2']);

    useFiltersStore.getState().saveBuilderFilter({
      sport: 'cycling',
      time: { kind: 'relative', amount: 90, unit: 'day' },
      distance: 10000,
      duration: 3600,
      elevationGain: 500,
      name: null,
    });

    useMapPreferencesStore.getState().setTrackIntensity('hot');
    useMapPreferencesStore.getState().setSessionColorMode({ sport: 'running', mode: 'hr' });
    useMapPreferencesStore.getState().setSessionSplitDistance({ sport: 'cycling', metres: 5000 });

    expect(useFiltersStore.getState().activeFilter).not.toBeNull();
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
    useFiltersStore.getState().resetFilters();
    useMapPreferencesStore.getState().resetMapPreferences();
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
    expect(useFiltersStore.getState().activeFilter).toBeNull();
    expect(useFiltersStore.getState().savedFilters).toHaveLength(3);
    expect(useMapPreferencesStore.getState().trackIntensity).toBe('warm');
    expect(useMapPreferencesStore.getState().bySport).toEqual({
      running: { colorMode: 'sport', lapSource: 'splits', splitDistance: null },
      cycling: { colorMode: 'sport', lapSource: 'splits', splitDistance: null },
    });
  });
});
