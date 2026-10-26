import { beforeEach, describe, it, expect } from 'vite-plus/test';
import { mock, type MockProxy } from 'vitest-mock-extended';
import type { QueryClient } from '@tanstack/react-query';
import {
  personalBestsQueryKey,
  invalidatePersonalBestsOfSession,
} from '@/queries/records/usePersonalBests.ts';
import { createMockPersonalBest } from '@pacevault/testing/personalBests.ts';

describe(invalidatePersonalBestsOfSession.name, () => {
  let queryClient: MockProxy<QueryClient>;

  beforeEach(() => {
    queryClient = mock<QueryClient>();
    queryClient.isFetching.mockReturnValue(0);
  });

  it('invalidates when the deleted session holds a PB', async () => {
    queryClient.getQueryData.mockReturnValue([createMockPersonalBest({ sessionId: 'a' })]);
    await invalidatePersonalBestsOfSession('a', queryClient);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: personalBestsQueryKey(),
      refetchType: 'all',
    });
  });

  it('skips when the deleted session holds no PB', async () => {
    queryClient.getQueryData.mockReturnValue([createMockPersonalBest({ sessionId: 'a' })]);
    await invalidatePersonalBestsOfSession('b', queryClient);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('skips when nothing has been computed yet', async () => {
    await invalidatePersonalBestsOfSession('a', queryClient);
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();
  });

  it('invalidates while a computation is in flight', async () => {
    queryClient.getQueryData.mockReturnValue([createMockPersonalBest({ sessionId: 'a' })]);
    queryClient.isFetching.mockReturnValue(1);
    await invalidatePersonalBestsOfSession('b', queryClient);
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: personalBestsQueryKey(),
      refetchType: 'all',
    });
  });
});
