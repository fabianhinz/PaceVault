import { z } from 'zod';

export const workerMessageInSchema = z.object({
  type: z.literal('build'),
  sessionIds: z.array(z.string()),
});

export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;

const workerMessageOutSchema = z.object({ type: z.literal('done') });

export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
