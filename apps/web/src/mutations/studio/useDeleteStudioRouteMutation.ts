import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { deleteStudioRoutePoints } from '@/lib/storage/db.ts';
import { studioRoutePointsQueryKey } from '@/queries/studio/useStudioRoutePoints.ts';

const deleteStudioRouteData = async (options: { routeId: string }): Promise<void> => {
  await deleteStudioRoutePoints(options.routeId);
};

export const useDeleteStudioRouteMutation = (): UseMutationResult<
  void,
  Error,
  { routeId: string }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStudioRouteData,
    onSuccess: (_data, variables) =>
      queryClient.removeQueries({ queryKey: studioRoutePointsQueryKey(variables) }),
  });
};
