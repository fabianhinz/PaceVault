import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { actions, isActionError, isInputError, type ActionError } from 'astro:actions';
import type { WriteResult } from '../actions/index.ts';

/**
 * The board's writes as TanStack mutations (`mutationKey: ['write']`, read back by the write
 * card through `useMutationState`). Each write sends the lines the board shows (`expected`, the
 * stale-file guard) as FormData to its action; on success, and on a 409 (the file changed since),
 * the board refetches. Nothing reloads.
 */

type Reply = { data: WriteResult; error: undefined } | { data: undefined; error: ActionError };
type FormWrite = (form: FormData) => Promise<Reply>;

export type WriteName =
  | 'plan.setStatus'
  | 'plan.toggleCheck'
  | 'plan.deleteCheck'
  | 'plan.answerQuestion'
  | 'plan.commentQuestion'
  | 'plan.deleteQuestion'
  | 'review.deleteFinding'
  | 'review.toggleDecision'
  | 'review.deleteDecision'
  | 'flaky.remove'
  | 'item.delete';

const WRITES: Record<WriteName, FormWrite> = {
  'plan.setStatus': actions.plan.setStatus,
  'plan.toggleCheck': actions.plan.toggleCheck,
  'plan.deleteCheck': actions.plan.deleteCheck,
  'plan.answerQuestion': actions.plan.answerQuestion,
  'plan.commentQuestion': actions.plan.commentQuestion,
  'plan.deleteQuestion': actions.plan.deleteQuestion,
  'review.deleteFinding': actions.review.deleteFinding,
  'review.toggleDecision': actions.review.toggleDecision,
  'review.deleteDecision': actions.review.deleteDecision,
  'flaky.remove': actions.flaky.remove,
  'item.delete': actions.item.delete,
};

export type WriteInput = { name: WriteName; fields: Record<string, string> };

/** `inline`: the caller shows the error itself (the answer dialog), not the write card. */
export type WriteMeta = { inline: boolean };

/** Input errors list the field messages instead of the raw validation dump. */
export const messageOf = (error: unknown): string => {
  if (isInputError(error)) {
    const fields = Object.values(error.fields).flatMap((messages) => messages ?? []);
    if (fields.length > 0) return fields.join(' ');
  }
  if (error instanceof Error) return error.message;
  return String(error);
};

const refetch = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: ['board'] });

const onErrorOf = (queryClient: QueryClient) => (error: unknown) => {
  if (isActionError(error) && error.code === 'CONFLICT') refetch(queryClient);
};

const runWrite = async (input: WriteInput): Promise<WriteResult> => {
  const form = new FormData();
  for (const entry of Object.entries(input.fields)) form.set(entry[0], entry[1]);
  const reply = await WRITES[input.name](form);
  if (reply.error !== undefined) throw reply.error;
  return reply.data;
};

export const useWrite = (options: { inline?: boolean } = {}) => {
  const queryClient = useQueryClient();
  const meta: WriteMeta = { inline: options.inline === true };
  return useMutation({
    mutationKey: ['write'],
    mutationFn: runWrite,
    meta,
    onSuccess: () => refetch(queryClient),
    onError: onErrorOf(queryClient),
  });
};

/** Writes the reverse of a write, if every file is still as that write left it. */
export const useUndo = () => {
  const queryClient = useQueryClient();
  const meta: WriteMeta = { inline: false };
  return useMutation({
    mutationKey: ['write'],
    mutationFn: async (result: WriteResult): Promise<WriteResult> => {
      const changes = result.changes.map((change) => ({
        path: change.path,
        before: change.before,
        after: change.after,
      }));
      const reply = await actions.undo({
        name: result.name,
        changes,
        folder: result.folder?.folder,
      });
      if (reply.error !== undefined) throw reply.error;
      return reply.data;
    },
    meta,
    onSuccess: () => refetch(queryClient),
    onError: onErrorOf(queryClient),
  });
};
