import { useMemo } from 'react';
import { useSessionsStore } from '@/store/sessions.ts';
import { useStoredSegments } from '@/queries/segments/useStoredSegments.ts';
import { useDetectedSegments } from '@/queries/segments/useDetectedSegments.ts';
import { segmentDetectionInputs } from '@/lib/analysis/segmentDetection.ts';
import {
  SEGMENT_DETECTOR_VERSION,
  type Segment,
  type SegmentDetectionInput,
  type StoredSegments,
} from '@/lib/workers/segmentsContract.ts';

export interface SegmentsState {
  segments: Segment[] | undefined;
  updating: boolean;
}

const LOADING: SegmentsState = { segments: undefined, updating: false };

const listOf = (entries: StoredSegments[]): Segment[] =>
  entries.flatMap((entry) => entry.segments).sort((a, b) => b.lastPassDate - a.lastPassDate);

const isCurrent = ({
  entries,
  inputs,
}: {
  entries: StoredSegments[];
  inputs: SegmentDetectionInput[];
}): boolean =>
  inputs.every((input) =>
    entries.some(
      (entry) =>
        entry.sport === input.sport &&
        entry.sessionsKey === input.sessionsKey &&
        entry.detectorVersion === SEGMENT_DETECTOR_VERSION,
    ),
  );

const storedState = ({
  stored,
  inputs,
}: {
  stored: StoredSegments[] | undefined;
  inputs: SegmentDetectionInput[];
}): SegmentsState => {
  if (stored === undefined) return LOADING;
  if (isCurrent({ entries: stored, inputs })) return { segments: listOf(stored), updating: false };
  if (stored.length === 0) return LOADING;
  return { segments: listOf(stored), updating: true };
};

export const useSegments = (options: { enabled?: boolean } = {}): SegmentsState => {
  const enabled = options.enabled ?? true;
  const storedSegments = useStoredSegments({ enabled });
  const detectedSegments = useDetectedSegments({ enabled });
  const sessions = useSessionsStore((s) => s.sessions);
  const inputs = useMemo(() => segmentDetectionInputs(sessions), [sessions]);
  const detected = detectedSegments.data;
  const placeholder = detectedSegments.isPlaceholderData;
  const stored = storedSegments.data;

  return useMemo(() => {
    if (detected !== undefined && !placeholder) {
      return { segments: listOf(detected), updating: false };
    }
    if (detected !== undefined) return { segments: listOf(detected), updating: true };
    return storedState({ stored, inputs });
  }, [detected, placeholder, stored, inputs]);
};
