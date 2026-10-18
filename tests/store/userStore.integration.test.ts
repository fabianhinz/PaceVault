import { describe, it, expect } from 'vite-plus/test';
import { useUserStore } from '@/store/user.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';
import { getDB } from '@/lib/db';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';

const flatProfile = (thresholds: Record<string, number>) => ({
  id: 'p',
  gender: 'female',
  thresholds,
  showMetricHelp: true,
  createdAt: 1,
});

const rehydrateFrom = async (state: unknown, version: number) => {
  const db = await getDB();
  await db.put('kv', JSON.stringify({ state, version }), 'store-user');
  await useUserStore.persist.rehydrate();
  return useUserStore.getState().profile;
};

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

  it('saveTodaysThresholds twice on one day keeps one entry for today with the second value', () => {
    const { id: _id, createdAt: _ca, ...profileData } = makeUserProfile();
    useUserStore.getState().setProfile(profileData);

    useUserStore.getState().saveTodaysThresholds({ ftp: 270, weight: 70 });
    useUserStore.getState().saveTodaysThresholds({ ftp: 280 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const profile = useUserStore.getState().profile;
    expect(profile?.thresholds.ftp).toEqual([
      { date: 0, value: 250 },
      { date: today.getTime(), value: 280 },
    ]);
    expect(profile?.weight).toEqual([{ date: today.getTime(), value: 70 }]);
    expect(profile?.thresholds.restHr).toEqual([{ date: 0, value: 50 }]);
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
    useUserStore.getState().saveTodaysThresholds({ maxHr: 200, restHr: 55 });

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

  it('migrates flat version 2 and version 1 thresholds into epoch-dated histories', async () => {
    const v2 = await rehydrateFrom(
      { profile: flatProfile({ restHr: 48, maxHr: 186, ftp: 240, thresholdPace: 280 }) },
      2,
    );
    expect(v2?.thresholds).toEqual({
      restHr: [{ date: 0, value: 48 }],
      maxHr: [{ date: 0, value: 186 }],
      ftp: [{ date: 0, value: 240 }],
      thresholdPace: [{ date: 0, value: 280 }],
    });
    if (!v2) throw new Error('profile missing');
    const anySession = thresholdsAt(v2, new Date('2019-05-04').getTime());
    expect(anySession).toMatchObject({ restHr: 48, maxHr: 186, ftp: 240, thresholdPace: 280 });

    const v1 = await rehydrateFrom({ profile: flatProfile({ restHr: 50, maxHr: 185 }) }, 1);
    expect(v1?.thresholds).toEqual({
      restHr: [{ date: 0, value: 50 }],
      maxHr: [{ date: 0, value: 185 }],
    });
    if (!v1) throw new Error('profile missing');
    expect(thresholdsAt(v1, Date.now()).ftp).toBeUndefined();
  });

  it('keeps an unrecognised shape when migrating version 2', () => {
    const migrate = useUserStore.persist.getOptions().migrate;
    expect(migrate?.('garbage', 2)).toBe('garbage');
    expect(migrate?.({ profile: { id: 'p', thresholds: 'x' } }, 2)).toEqual({
      profile: { id: 'p', thresholds: 'x' },
    });
  });

  it("drops a persisted profile with the removed gender 'other' instead of throwing", async () => {
    const profile = await rehydrateFrom(
      {
        profile: {
          ...flatProfile({}),
          gender: 'other',
          thresholds: { restHr: [{ date: 0, value: 48 }], maxHr: [{ date: 0, value: 186 }] },
        },
      },
      3,
    );
    expect(profile).toBeNull();
  });

  it('drops an invalid history entry on hydration and keeps the rest', async () => {
    const profile = await rehydrateFrom(
      {
        profile: {
          ...flatProfile({}),
          thresholds: {
            restHr: [{ date: 0, value: 48 }],
            maxHr: [{ date: 0, value: 186 }],
            ftp: [
              { date: 0, value: 240 },
              { date: 'yesterday', value: 260 },
              { date: 5_000, value: 250 },
            ],
          },
        },
      },
      3,
    );
    expect(profile?.thresholds.ftp).toEqual([
      { date: 0, value: 240 },
      { date: 5_000, value: 250 },
    ]);
    expect(profile?.thresholds.restHr).toEqual([{ date: 0, value: 48 }]);
  });
});
