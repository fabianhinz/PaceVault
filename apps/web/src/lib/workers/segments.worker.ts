import { detectSegmentsForSport } from '@/lib/analysis/segmentDetection.ts';
import {
  SEGMENT_DETECTOR_VERSION,
  workerMessageInSchema,
  type SegmentDetectionMetrics,
  type SportDetectionMetrics,
  type StoredSegments,
  type WorkerMessageOut,
} from './segmentsContract.ts';

const environment = (): SegmentDetectionMetrics['environment'] => {
  let deviceMemoryGb: number | null = null;
  if ('deviceMemory' in navigator && typeof navigator.deviceMemory === 'number') {
    deviceMemoryGb = navigator.deviceMemory;
  }
  return {
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemoryGb,
    userAgent: navigator.userAgent,
  };
};

self.onmessage = async (event: MessageEvent<unknown>) => {
  const startMs = performance.now();
  const parsed = workerMessageInSchema.safeParse(event.data);
  const entries: StoredSegments[] = [];
  const sports: SportDetectionMetrics[] = [];
  if (parsed.success) {
    const ignoreCache = parsed.data.ignoreCache === true;
    for (const input of parsed.data.sports) {
      const detection = await detectSegmentsForSport({ ...input, ignoreCache });
      entries.push(detection.entry);
      sports.push(detection.metrics);
    }
  }
  const metrics: SegmentDetectionMetrics = {
    detectorVersion: SEGMENT_DETECTOR_VERSION,
    environment: environment(),
    workerMs: performance.now() - startMs,
    mainThreadMs: null,
    sports,
  };
  self.postMessage({ type: 'done', entries, metrics } satisfies WorkerMessageOut);
};
