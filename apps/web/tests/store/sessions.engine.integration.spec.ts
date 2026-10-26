import { describe, it, expect } from 'vite-plus/test';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { dailyMetricsFromSessions } from '@pacevault/engine/metrics.ts';
import { getCoachingRecommendation } from '@/lib/coachingMessages.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

describe('store + engine integration (no React)', () => {
  it('full pipeline: profile → sessions → metrics → coaching', () => {
    const { id: _id, createdAt: _ca, ...profileData } = createMockUserProfile();
    useUserStore.getState().setProfile(profileData);
    expect(useUserStore.getState().profile).not.toBeNull();

    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      const { createdAt: _sca, ...sessionData } = createMockTrainingSession({
        id: `session-${i}`,
        date: now - (30 - i) * MS_PER_DAY,
        tss: 80 + 20 * Math.sin(i * 0.5),
      });
      useSessionsStore.getState().addSessions({ sessions: [sessionData] });
    }

    expect(useSessionsStore.getState().sessions).toHaveLength(30);

    const sessions = useSessionsStore.getState().sessions;
    const metrics = dailyMetricsFromSessions({ sessions });
    expect(metrics.length).toBeGreaterThan(0);

    const current = dailyMetricsFromSessions({ sessions }).at(-1);
    expect(current).toBeDefined();
    expect(current?.ctl).toBeGreaterThan(0);
    expect(current?.atl).toBeGreaterThan(0);

    const coaching = getCoachingRecommendation({ metrics: current, historyDays: metrics.length });
    expect(coaching.message).not.toBe('');
    expect(['detraining', 'fresh', 'neutral', 'optimal', 'overload']).toContain(coaching.status);
    expect(['low', 'moderate', 'high']).toContain(coaching.injuryRisk);
  });

  it('full reset: populate everything → clear all stores → verify empty', () => {
    const { id: _id, createdAt: _ca, ...profileData } = createMockUserProfile();
    useUserStore.getState().setProfile(profileData);

    const { createdAt: _sca, ...sessionData } = createMockTrainingSession();
    useSessionsStore.getState().addSessions({ sessions: [sessionData] });

    expect(useUserStore.getState().profile).not.toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    useUserStore.getState().resetProfile();
    useSessionsStore.getState().clearAll();

    expect(useUserStore.getState().profile).toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });
});
