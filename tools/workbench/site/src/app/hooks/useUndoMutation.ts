import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { actions } from 'astro:actions';
import type { WriteResult } from '@site/actions/index.ts';
import type { WriteMeta } from '@site/app/types.ts';
import { refetchBoard, refetchBoardOnConflict } from './boardRefetch.ts';

const runUndo = async (write: WriteResult): Promise<WriteResult> => {
  const changes = write.changes.map((change) => ({
    path: change.path,
    before: change.before,
    after: change.after,
  }));
  const reply = await actions.undo({
    name: write.name,
    changes,
    folder: write.folder?.folder,
  });
  if (reply.error !== undefined) throw reply.error;
  return reply.data;
};

export const useUndoMutation = (): UseMutationResult<WriteResult, unknown, WriteResult> => {
  const queryClient = useQueryClient();
  const meta: WriteMeta = { inline: false };
  return useMutation({
    mutationKey: ['write'],
    mutationFn: runUndo,
    meta,
    onSuccess: () => refetchBoard(queryClient),
    onError: refetchBoardOnConflict(queryClient),
  });
};
