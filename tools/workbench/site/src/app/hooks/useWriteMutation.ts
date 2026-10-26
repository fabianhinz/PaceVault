import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { actions, type ActionError } from 'astro:actions';
import type { WriteResult } from '@site/actions/index.ts';
import type { WriteMeta } from '@site/app/types.ts';
import { refetchBoard, refetchBoardOnConflict } from './boardRefetch.ts';

type Reply = { data: WriteResult; error: undefined } | { data: undefined; error: ActionError };
type FormWrite = (form: FormData) => Promise<Reply>;

type WriteName =
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

type WriteInput = { name: WriteName; fields: Record<string, string> };

const runWrite = async (input: WriteInput): Promise<WriteResult> => {
  const form = new FormData();
  for (const entry of Object.entries(input.fields)) form.set(entry[0], entry[1]);
  const reply = await WRITES[input.name](form);
  if (reply.error !== undefined) throw reply.error;
  return reply.data;
};

export const useWriteMutation = (
  options: { inline?: boolean } = {},
): UseMutationResult<WriteResult, unknown, WriteInput> => {
  const queryClient = useQueryClient();
  const meta: WriteMeta = { inline: options.inline === true };
  return useMutation({
    mutationKey: ['write'],
    mutationFn: runWrite,
    meta,
    onSuccess: () => refetchBoard(queryClient),
    onError: refetchBoardOnConflict(queryClient),
  });
};
