import type { SegmentDetectionMetrics } from '@/lib/workers/segmentsContract.ts';

export const SEGMENT_DEBUG_FLAG_KEY = 'pv:debug:segments';
const COLD_FLAG_VALUE = 'cold';

export type SegmentDebugMode = 'off' | 'log' | 'cold';

declare global {
  interface Window {
    pvSegmentMetrics?: SegmentDetectionMetrics;
  }
}

const roundedMs = (_key: string, value: unknown): unknown => {
  if (typeof value !== 'number' || Number.isInteger(value)) return value;
  return Math.round(value * 10) / 10;
};

let latestMetrics: SegmentDetectionMetrics | null = null;

const storedFlag = (): string | null => {
  try {
    return localStorage.getItem(SEGMENT_DEBUG_FLAG_KEY);
  } catch {
    return null;
  }
};

export const segmentDebugMode = (): SegmentDebugMode => {
  const flag = storedFlag();
  if (flag === COLD_FLAG_VALUE) return 'cold';
  if (flag !== null || import.meta.env.DEV) return 'log';
  return 'off';
};

export const latestSegmentMetrics = (): SegmentDetectionMetrics | null => latestMetrics;

export const reportSegmentMetrics = (metrics: SegmentDetectionMetrics): void => {
  latestMetrics = metrics;
  if (segmentDebugMode() === 'off') return;
  window.pvSegmentMetrics = metrics;
  console.info('[segments] detection metrics', JSON.stringify(metrics, roundedMs, 2));
};
