import { describe, it, expect } from 'vitest';
import { useUserStore } from '@/store/user.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';
import { createDefaultProfile } from '@/lib/defaults.ts';
import { getDB } from '@/lib/db';

describe('user store', () => {
  it('setProfile auto-generates id and createdAt', () => {
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);

    const profile = useUserStore.getState().profile;
    expect(profile).not.toBeNull();
    expect(profile?.id).toBeTruthy();
    expect(profile?.createdAt).toBeGreaterThan(0);
    expect(profile?.gender).toBe('male');
  });

  it('updateThresholds only changes thresholds', () => {
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);

    useUserStore.getState().updateThresholds({
      ftp: 280,
      maxHr: 195,
      restHr: 48,
    });

    const profile = useUserStore.getState().profile;
    expect(profile?.thresholds.ftp).toBe(280);
    expect(profile?.thresholds.maxHr).toBe(195);
    expect(profile?.thresholds.restHr).toBe(48);
    expect(profile?.gender).toBe('male');
  });

  it('resetProfile → null', () => {
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);
    expect(useUserStore.getState().profile).not.toBeNull();

    useUserStore.getState().resetProfile();
    expect(useUserStore.getState().profile).toBeNull();
  });

  it('persistence: data survives in IndexedDB', async () => {
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);

    await new Promise((r) => setTimeout(r, 50));

    const db = await getDB();
    const stored = await db.get('kv', 'store-user');
    expect(stored).toBeDefined();
    const parsed = JSON.parse(stored ?? '{}');
    expect(parsed.state.profile.gender).toBe('male');
  });

  it('operations on null profile are no-ops', () => {
    expect(useUserStore.getState().profile).toBeNull();

    useUserStore.getState().setProfileGender('female');
    useUserStore.getState().updateThresholds({ maxHr: 200, restHr: 55 });

    expect(useUserStore.getState().profile).toBeNull();
  });

  it('drops the auto session names toggle when migrating version 1 profiles', () => {
    const migrate = useUserStore.persist.getOptions().migrate;
    const migrated = migrate?.(
      { profile: { id: 'p', gender: 'female', useAutoSessionNames: true } },
      1,
    );
    expect(migrated).toEqual({ profile: { id: 'p', gender: 'female' } });
  });

  it('keeps a missing or unrecognised profile when migrating version 1', () => {
    const migrate = useUserStore.persist.getOptions().migrate;
    expect(migrate?.({ profile: null }, 1)).toEqual({ profile: null });
    expect(migrate?.('garbage', 1)).toBe('garbage');
  });
});

describe('createDefaultProfile', () => {
  it('returns a complete profile with sensible defaults', () => {
    const profile = createDefaultProfile('test-id');

    expect(profile.id).toBe('test-id');
    expect(profile.gender).toBe('male');
    expect(profile.thresholds.maxHr).toBe(203);
    expect(profile.thresholds.restHr).toBe(44);
    expect(profile.showMetricHelp).toBe(true);
    expect(profile.createdAt).toBeGreaterThan(0);
  });

  it('does not include removed fields', () => {
    const profile = createDefaultProfile('test-id');
    expect('name' in profile).toBe(false);
    expect('age' in profile).toBe(false);
    expect('weight' in profile).toBe(false);
    expect('height' in profile).toBe(false);
    expect('sports' in profile).toBe(false);
    expect('trainingDays' in profile).toBe(false);
    expect('goals' in profile).toBe(false);
    expect('welcomeDismissed' in profile).toBe(false);
    expect('onboardingCompleted' in profile).toBe(false);
    expect('useAutoSessionNames' in profile).toBe(false);
  });
});
