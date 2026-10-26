import { useQuery, type QueryClient, type UseQueryResult } from '@tanstack/react-query';
import { getStudioRoutePoints } from '@/lib/db.ts';
import type { QueryResults } from '@/types.ts';

export const loadStudioRoutePoints = async (options: {
  routeId: string;
}): Promise<QueryResults['studioRoutePoints']> => getStudioRoutePoints(options.routeId);

export const studioRoutePointsQueryKey = (options: { routeId: string }): string[] => [
  'studio-route-points',
  options.routeId,
];

export const invalidateStudioRoutePoints = (
  options: { routeId: string },
  queryClient: QueryClient,
): Promise<void> => queryClient.invalidateQueries({ queryKey: studioRoutePointsQueryKey(options) });

export const resetStudioRoutePoints = (queryClient: QueryClient): void => {
  queryClient.removeQueries({ queryKey: ['studio-route-points'] });
};

export const useStudioRoutePoints = (options: {
  routeId: string;
}): UseQueryResult<QueryResults['studioRoutePoints']> =>
  useQuery({
    queryKey: studioRoutePointsQueryKey(options),
    queryFn: () => loadStudioRoutePoints(options),
    staleTime: Infinity,
    networkMode: 'always',
  });
