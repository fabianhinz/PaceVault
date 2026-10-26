import type { QueryClient } from '@tanstack/react-query';
import { isActionError } from 'astro:actions';
import { boardQueryKey } from './useBoard.ts';

export const refetchBoard = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: boardQueryKey() });

export const refetchBoardOnConflict = (queryClient: QueryClient) => (error: unknown) => {
  if (isActionError(error) && error.code === 'CONFLICT') void refetchBoard(queryClient);
};
