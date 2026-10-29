import { queryOptions, useQuery, type UseQueryResult } from '@tanstack/react-query';
import { actions } from 'astro:actions';
import type { BoardView } from '@site/lib/board.ts';

export const boardQueryKey = () => ['board'] as const;

// No parameter: `orThrow` passed directly would get TanStack's query context as its input.
const fetchBoard = () => actions.board.read.orThrow();

const boardQueryOptions = () =>
  queryOptions({
    queryKey: boardQueryKey(),
    queryFn: fetchBoard,
  });

export const useBoard = (): UseQueryResult<BoardView> => useQuery(boardQueryOptions());
