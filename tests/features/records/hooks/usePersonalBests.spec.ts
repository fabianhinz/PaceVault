import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import {
  PERSONAL_BESTS_KEY,
  invalidatePersonalBestsOfSession,
} from '@/features/records/hooks/usePersonalBests.ts';
import type { PersonalBest } from '@/packages/engine/types.ts';

const pb = (sessionId: string): PersonalBest => ({
  sport: 'cycling',
  category: 'peak-power',
  window: 5,
  value: 300,
  sessionId,
  date: 0,
});

const setup = (pbs: PersonalBest[] | undefined) => {
  const queryClient = new QueryClient();
  if (pbs) queryClient.setQueryData(PERSONAL_BESTS_KEY, pbs);
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  return { queryClient, invalidate };
};

describe('invalidatePersonalBestsOfSession', () => {
  it('invalidates when the deleted session holds a PB', () => {
    const ctx = setup([pb('a')]);
    invalidatePersonalBestsOfSession(ctx.queryClient, 'a');
    expect(ctx.invalidate).toHaveBeenCalled();
  });

  it('skips when the deleted session holds no PB', () => {
    const ctx = setup([pb('a')]);
    invalidatePersonalBestsOfSession(ctx.queryClient, 'b');
    expect(ctx.invalidate).not.toHaveBeenCalled();
  });

  it('skips when nothing has been computed yet', () => {
    const ctx = setup(undefined);
    invalidatePersonalBestsOfSession(ctx.queryClient, 'a');
    expect(ctx.invalidate).not.toHaveBeenCalled();
  });

  it('invalidates while a computation is in flight', () => {
    const ctx = setup([pb('a')]);
    vi.spyOn(ctx.queryClient, 'isFetching').mockReturnValue(1);
    invalidatePersonalBestsOfSession(ctx.queryClient, 'b');
    expect(ctx.invalidate).toHaveBeenCalled();
  });
});
