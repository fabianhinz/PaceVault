import { useMemo } from 'react';
import {
  sessionSegmentsInRideOrder,
  type SessionSegment,
} from '@/components/segments/segmentPasses.ts';
import { useSegments } from './useSegments.ts';

export const useSessionSegments = (sessionId: string): SessionSegment[] | undefined => {
  const segments = useSegments().segments;
  return useMemo(() => {
    if (segments === undefined) return undefined;
    return sessionSegmentsInRideOrder({ segments, sessionId });
  }, [segments, sessionId]);
};
