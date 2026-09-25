import { describe, it, expect } from 'vitest';
import { usePersonalBestsStore } from '@/store/personalBests.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { saveSessionRecords } from '@/lib/indexeddb.ts';
import { makeCyclingRecords } from '@tests/factories/records.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import type { PBSessionInput } from '@/lib/records.ts';

const ride = (sessionId: string, basePower: number): PBSessionInput => ({
  sessionId,
  date: Date.now(),
  sport: 'cycling',
  records: makeCyclingRecords(600, { basePower }),
});

const peakPowerHolder = () =>
  usePersonalBestsStore.getState().pbs.find((pb) => pb.category === 'peak-power' && pb.window === 5)
    ?.sessionId;

const storeRide = async (id: string, basePower: number) => {
  const session = makeSession({ id, sport: 'cycling' });
  useSessionsStore.setState((s) => ({ sessions: [...s.sessions, session] }));
  await saveSessionRecords(id, makeCyclingRecords(600, { basePower }));
};

describe('usePersonalBestsStore', () => {
  it('merges the PBs of added sessions into the existing ones', () => {
    usePersonalBestsStore.getState().addSessionPBs([ride('weak', 180)]);
    expect(peakPowerHolder()).toBe('weak');

    usePersonalBestsStore.getState().addSessionPBs([ride('strong', 300)]);
    expect(peakPowerHolder()).toBe('strong');

    usePersonalBestsStore.getState().addSessionPBs([ride('weaker', 150)]);
    expect(peakPowerHolder()).toBe('strong');
  });

  it('recomputes from all sessions with records, skipping planned ones', async () => {
    await storeRide('real', 200);
    await storeRide('planned', 400);
    useSessionsStore.setState((s) => ({
      sessions: s.sessions.map((session) => {
        if (session.id !== 'planned') return session;
        return { ...session, isPlanned: true };
      }),
    }));

    await usePersonalBestsStore.getState().recomputeAllPBs();

    expect(peakPowerHolder()).toBe('real');
  });

  it('keeps PBs added while a recompute is running', async () => {
    await storeRide('stored', 200);

    const recompute = usePersonalBestsStore.getState().recomputeAllPBs();
    usePersonalBestsStore.getState().addSessionPBs([ride('synced', 350)]);
    await recompute;

    expect(peakPowerHolder()).toBe('synced');
  });

  it('lets the latest recompute win', async () => {
    await storeRide('old', 200);
    const first = usePersonalBestsStore.getState().recomputeAllPBs();

    useSessionsStore.setState({ sessions: [] });
    const second = usePersonalBestsStore.getState().recomputeAllPBs();
    await Promise.all([first, second]);

    expect(usePersonalBestsStore.getState().pbs).toEqual([]);
  });

  it('recomputes after removing a session that holds a PB', async () => {
    await storeRide('keep', 200);
    await storeRide('gone', 300);
    await usePersonalBestsStore.getState().recomputeAllPBs();
    expect(peakPowerHolder()).toBe('gone');

    useSessionsStore.setState((s) => ({ sessions: s.sessions.filter((x) => x.id !== 'gone') }));
    await usePersonalBestsStore.getState().removeSessionPBs('gone');

    expect(peakPowerHolder()).toBe('keep');
  });

  it('skips the recompute when the removed session holds no PB', async () => {
    usePersonalBestsStore.getState().addSessionPBs([ride('holder', 300)]);

    await usePersonalBestsStore.getState().removeSessionPBs('other');

    expect(peakPowerHolder()).toBe('holder');
  });

  it('clears all PBs', () => {
    usePersonalBestsStore.getState().addSessionPBs([ride('a', 200)]);
    usePersonalBestsStore.getState().clearPBs();
    expect(usePersonalBestsStore.getState().pbs).toEqual([]);
  });

  it('persists only the PBs', () => {
    usePersonalBestsStore.getState().addSessionPBs([ride('a', 200)]);
    const options = usePersonalBestsStore.persist.getOptions();
    if (!options.partialize) throw new Error('partialize missing');
    expect(options.partialize(usePersonalBestsStore.getState())).toEqual({
      pbs: usePersonalBestsStore.getState().pbs,
    });
  });
});
