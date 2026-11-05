import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  deleteSessionRecords,
  deleteSessionLaps,
  deleteSessionGPS,
  deleteFitFile,
  deleteSessionWeather,
  deleteSegmentPassesEntries,
} from '@/lib/storage/db.ts';
import { sessionGpsQueryKey } from '@/queries/sessions/useSessionGps.ts';

const deleteSessionData = async (options: {
  sessionId: string;
  segmentIds: string[];
}): Promise<void> => {
  await Promise.all([
    deleteSessionRecords(options.sessionId),
    deleteSessionLaps(options.sessionId),
    deleteSessionGPS(options.sessionId),
    deleteSessionWeather(options.sessionId),
    deleteFitFile(options.sessionId),
    deleteSegmentPassesEntries(options.segmentIds),
  ]);
};

export const useDeleteSessionMutation = (): UseMutationResult<
  void,
  Error,
  { sessionId: string; segmentIds: string[] }
> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSessionData,
    onSuccess: (_data, variables) =>
      queryClient.removeQueries({
        queryKey: sessionGpsQueryKey({ sessionId: variables.sessionId }),
      }),
  });
};
