import { queryOptions, useQuery } from '@tanstack/react-query';
import { actions } from 'astro:actions';

/**
 * The whole board as one query (`['board']`), read by the `board.read` action. Writes and the
 * dev server's `wb:changed` invalidate it; the old data stays on screen until the new arrives.
 * The arrow matters: `orThrow` passed directly would get TanStack's query context as its input.
 */
export const boardQueryOptions = () =>
  queryOptions({
    queryKey: ['board'],
    queryFn: () => actions.board.read.orThrow(),
  });

export const useBoard = () => useQuery(boardQueryOptions());
