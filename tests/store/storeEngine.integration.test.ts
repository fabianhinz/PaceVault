import { describe, it, expect } from 'vitest';
import { useUserStore } from '@/store/user.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { computeMetrics } from '@/packages/engine/metrics.ts';
import { getCoachingRecommendation } from '@/lib/coachingMessages.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';
import { makeSession } from '@tests/factories/sessions.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('store + engine integration (no React)', () => {
  it('full pipeline: profile → sessions → metrics → coaching', () => {
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);
    expect(useUserStore.getState().profile).not.toBeNull();

    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      const { createdAt: _sca, ...sessionData } = makeSession({
        id: `session-${i}`,
        date: now - (30 - i) * DAY_MS,
        tss: 80 + 20 * Math.sin(i * 0.5),
      });
      useSessionsStore.getState().addSessions([sessionData]);
    }

    expect(useSessionsStore.getState().sessions).toHaveLength(30);

    const sessions = useSessionsStore.getState().sessions;
    const metrics = computeMetrics(sessions);
    expect(metrics.length).toBeGreaterThan(0);

    const current = computeMetrics(sessions).at(-1);
    expect(current).toBeDefined();
    expect(current?.ctl).toBeGreaterThan(0);
    expect(current?.atl).toBeGreaterThan(0);

    const coaching = getCoachingRecommendation(current, metrics.length);
    expect(coaching.status).toBeTruthy();
    expect(coaching.message).toBeTruthy();
    expect(['detraining', 'fresh', 'neutral', 'optimal', 'overload']).toContain(coaching.status);
    expect(['low', 'moderate', 'high']).toContain(coaching.injuryRisk);
  });

  it('full reset: populate everything → clear all stores → verify empty', () => {
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);

    const { createdAt: _sca, ...sessionData } = makeSession();
    useSessionsStore.getState().addSessions([sessionData]);

    expect(useUserStore.getState().profile).not.toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    useUserStore.getState().resetProfile();
    useSessionsStore.getState().clearAll();

    expect(useUserStore.getState().profile).toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });
});
