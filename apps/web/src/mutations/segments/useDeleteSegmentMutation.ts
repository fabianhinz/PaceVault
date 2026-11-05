import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { deleteSegmentPassesEntries } from '@/lib/storage/db.ts';

const deleteSegmentData = (options: { segmentId: string }): Promise<void> =>
  deleteSegmentPassesEntries([options.segmentId]);

export const useDeleteSegmentMutation = (): UseMutationResult<void, Error, { segmentId: string }> =>
  useMutation({ mutationFn: deleteSegmentData });
