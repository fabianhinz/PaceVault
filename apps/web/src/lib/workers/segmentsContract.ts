import { z } from 'zod';
import { SPORTS } from '@pacevault/engine/types.ts';

export const SEGMENT_MATCHER_VERSION = 1;

export const segmentSessionMetaSchema = z.object({
  sessionId: z.string(),
  sport: z.enum(SPORTS),
  date: z.number(),
  derivationVersion: z.number(),
});

export type SegmentSessionMeta = z.infer<typeof segmentSessionMetaSchema>;

export const storedSegmentPassSchema = z.object({
  sessionId: z.string(),
  date: z.number(),
  startTimestampSec: z.number(),
  endTimestampSec: z.number(),
  durationSec: z.number(),
  coverageRatio: z.number(),
});

export type StoredSegmentPass = z.infer<typeof storedSegmentPassSchema>;

export const segmentPassesEntrySchema = z.object({
  segmentId: z.string(),
  matcherVersion: z.number(),
  sourceSessionKey: z.string(),
  checkedSessionKeys: z.array(z.string()),
  passes: z.array(storedSegmentPassSchema),
});

export type SegmentPassesEntry = z.infer<typeof segmentPassesEntrySchema>;

const boundsSchema = z.object({
  minLat: z.number(),
  maxLat: z.number(),
  minLng: z.number(),
  maxLng: z.number(),
});

export const segmentMatchInputSchema = z.object({
  segmentId: z.string(),
  sport: z.enum(SPORTS),
  bounds: boundsSchema,
  source: z.object({
    sessionId: z.string(),
    startSec: z.number(),
    endSec: z.number(),
  }),
});

export type SegmentMatchInput = z.infer<typeof segmentMatchInputSchema>;

export const workerMessageInSchema = z.object({
  type: z.literal('match'),
  segments: z.array(segmentMatchInputSchema),
  sessions: z.array(segmentSessionMetaSchema),
  ignoreCache: z.boolean().optional(),
});

export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;

export const segmentMatchMetricsSchema = z.object({
  segmentId: z.string(),
  cache: z.enum(['hit', 'partial', 'miss']),
  missReason: z.enum(['noEntry', 'matcherVersion', 'sourceSession', 'forced']).nullable(),
  sessionsChecked: z.number(),
  bboxCandidates: z.number(),
  recordsRead: z.number(),
  referencePoints: z.number(),
  passes: z.number(),
  ms: z.number(),
});

export type SegmentMatchMetrics = z.infer<typeof segmentMatchMetricsSchema>;

export const segmentMatchingMetricsSchema = z.object({
  matcherVersion: z.number(),
  environment: z.object({
    hardwareConcurrency: z.number().nullable(),
    deviceMemoryGb: z.number().nullable(),
    userAgent: z.string(),
  }),
  workerMs: z.number(),
  mainThreadMs: z.number().nullable(),
  sessionsRead: z.number(),
  segments: z.array(segmentMatchMetricsSchema),
});

export type SegmentMatchingMetrics = z.infer<typeof segmentMatchingMetricsSchema>;

export const workerMessageOutSchema = z.object({
  type: z.literal('done'),
  entries: z.array(segmentPassesEntrySchema),
  metrics: segmentMatchingMetricsSchema.optional(),
});

export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
