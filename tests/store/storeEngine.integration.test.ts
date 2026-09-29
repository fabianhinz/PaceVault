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
    // Set up profile
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);
    expect(useUserStore.getState().profile).not.toBeNull();

    // Add 30 sessions over 30 days
    const now = Date.now();
    for (let i = 0; i < 30; i++) {
      const {
        id: _sid,
        createdAt: _sca,
        ...sessionData
      } = makeSession({
        date: now - (30 - i) * DAY_MS,
        tss: 80 + 20 * Math.sin(i * 0.5),
      });
      useSessionsStore.getState().addSessions([sessionData]);
    }

    expect(useSessionsStore.getState().sessions).toHaveLength(30);

    // Compute metrics from store's sessions
    const sessions = useSessionsStore.getState().sessions;
    const metrics = computeMetrics(sessions);
    expect(metrics.length).toBeGreaterThan(0);

    const current = computeMetrics(sessions).at(-1);
    expect(current).toBeDefined();
    expect(current?.ctl).toBeGreaterThan(0);
    expect(current?.atl).toBeGreaterThan(0);

    // Get coaching recommendation
    const coaching = getCoachingRecommendation(current, metrics.length);
    expect(coaching.status).toBeTruthy();
    expect(coaching.message).toBeTruthy();
    expect(['detraining', 'fresh', 'neutral', 'optimal', 'overload']).toContain(coaching.status);
    expect(['low', 'moderate', 'high']).toContain(coaching.injuryRisk);
  });

  it('full reset: populate everything → clear all stores → verify empty', () => {
    // Populate
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);

    const { id: _sid, createdAt: _sca, ...sessionData } = makeSession();
    useSessionsStore.getState().addSessions([sessionData]);

    // Verify populated
    expect(useUserStore.getState().profile).not.toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(1);

    // Clear all
    useUserStore.getState().resetProfile();
    useSessionsStore.getState().clearAll();

    // Verify empty
    expect(useUserStore.getState().profile).toBeNull();
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });
});
