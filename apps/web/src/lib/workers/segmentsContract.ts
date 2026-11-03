import { z } from 'zod';
import { SPORTS } from '@pacevault/engine/types.ts';
import { SEGMENT_DETECTION_PHASES } from '@pacevault/engine/segments.ts';

export const SEGMENT_DETECTOR_VERSION = 1;

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
  splitDurationsSec: z.array(z.number()),
  coverageRatio: z.number(),
});

export type StoredSegmentPass = z.infer<typeof storedSegmentPassSchema>;

const segmentTypeSchema = z.enum(['climb', 'flat', 'descent', 'route']);

export const segmentSchema = z.object({
  id: z.string(),
  sport: z.enum(SPORTS),
  type: segmentTypeSchema,
  typeNumber: z.number(),
  distanceMeters: z.number(),
  netElevationMeters: z.number().nullable(),
  geometry: z.array(z.tuple([z.number(), z.number()])),
  passes: z.array(storedSegmentPassSchema),
  lastPassDate: z.number(),
});

export type Segment = z.infer<typeof segmentSchema>;

export const storedSegmentsSchema = z.object({
  sport: z.enum(SPORTS),
  sessionsKey: z.string(),
  detectorVersion: z.number(),
  segments: z.array(segmentSchema),
});

export type StoredSegments = z.infer<typeof storedSegmentsSchema>;

export const segmentDetectionInputSchema = z.object({
  sport: z.enum(SPORTS),
  sessionsKey: z.string(),
  sessions: z.array(segmentSessionMetaSchema),
});

export type SegmentDetectionInput = z.infer<typeof segmentDetectionInputSchema>;

export const workerMessageInSchema = z.object({
  type: z.literal('detect'),
  sports: z.array(segmentDetectionInputSchema),
  ignoreCache: z.boolean().optional(),
});

export type WorkerMessageIn = z.infer<typeof workerMessageInSchema>;

export const segmentEngineStatsSchema = z.object({
  leadsProcessed: z.number(),
  leadsSkippedAsRoute: z.number(),
  turnAnchors: z.number(),
  climbAnchors: z.number(),
  atoms: z.number(),
  corridorMatches: z.number(),
  candidates: z.number(),
  droppedAsDuplicate: z.number(),
  msByPhase: z.record(z.enum(SEGMENT_DETECTION_PHASES), z.number()),
});

export const sportDetectionMetricsSchema = z.object({
  sport: z.enum(SPORTS),
  cache: z.enum(['hit', 'miss']),
  missReason: z.enum(['noEntry', 'sessionsKey', 'detectorVersion', 'forced']).nullable(),
  sessions: z.number(),
  sessionsWithRecords: z.number(),
  records: z.number(),
  tracks: z.number(),
  resampledPoints: z.number(),
  segmentsByType: z.record(segmentTypeSchema, z.number()),
  passes: z.number(),
  engine: segmentEngineStatsSchema.nullable(),
  ms: z.object({
    readRecords: z.number(),
    slowestSessionRead: z.number(),
    segmentTrack: z.number(),
    detectedSegments: z.number(),
    storedSegments: z.number(),
    saveCache: z.number(),
    total: z.number(),
  }),
});

export type SportDetectionMetrics = z.infer<typeof sportDetectionMetricsSchema>;

export const segmentDetectionMetricsSchema = z.object({
  detectorVersion: z.number(),
  environment: z.object({
    hardwareConcurrency: z.number().nullable(),
    deviceMemoryGb: z.number().nullable(),
    userAgent: z.string(),
  }),
  workerMs: z.number(),
  mainThreadMs: z.number().nullable(),
  sports: z.array(sportDetectionMetricsSchema),
});

export type SegmentDetectionMetrics = z.infer<typeof segmentDetectionMetricsSchema>;

export const workerMessageOutSchema = z.object({
  type: z.literal('done'),
  entries: z.array(storedSegmentsSchema),
  metrics: segmentDetectionMetricsSchema.optional(),
});

export type WorkerMessageOut = z.infer<typeof workerMessageOutSchema>;
