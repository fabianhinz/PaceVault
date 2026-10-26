import { z } from 'zod';
import { SPORTS, type PersonalBest } from '@pacevault/engine/types.ts';

const pbSessionMetaSchema = z.object({
  sessionId: z.string(),
  date: z.number(),
  sport: z.enum(SPORTS),
  distance: z.number().optional(),
  elevationGain: z.number().optional(),
});

export type PBSessionMeta = z.infer<typeof pbSessionMetaSchema>;

const workerMessageInSchema = z.object({
  type: z.literal('compute'),
  sessions: z.array(pbSessionMetaSchema),
});

export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;

const personalBestSchema = z.object({
  sport: z.enum(SPORTS),
  category: z.enum(['peak-power', 'fastest-distance', 'longest', 'most-elevation']),
  window: z.number(),
  value: z.number(),
  sessionId: z.string(),
  date: z.number(),
}) satisfies z.ZodType<PersonalBest>;

const workerMessageOutSchema = z.object({
  type: z.literal('done'),
  pbs: z.array(personalBestSchema),
});

export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
