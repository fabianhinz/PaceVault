import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { clearAllRecords } from '@/lib/db.ts';

export const useClearAllDataMutation = (): UseMutationResult<void, Error, void> =>
  useMutation({ mutationFn: clearAllRecords });
