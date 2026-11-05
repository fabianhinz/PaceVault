import { useState } from 'react';
import type { TrainingSession } from '@pacevault/engine/types.ts';
import { useSegmentsStore, type Segment } from '@/store/segments.ts';
import { useSessionGps } from '@/queries/sessions/useSessionGps.ts';
import { getSessionRecords } from '@/lib/storage/db.ts';
import { segmentDraft } from '@/components/segments/segmentCreation.ts';

interface SessionReferenceSegment {
  available: boolean;
  referenceSegmentId: string | null;
  preparing: boolean;
  wholeSessionDraft: () => Promise<Segment | null>;
}

export const useSessionReferenceSegment = (session: TrainingSession): SessionReferenceSegment => {
  const [preparing, setPreparing] = useState(false);
  const sessionGps = useSessionGps({
    sessionId: session.id,
    enabled: session.hasDetailedRecords,
  });
  const referenceSegmentId = useSegmentsStore(
    (s) =>
      s.segments.find(
        (segment) => segment.source.sessionId === session.id && segment.source.kind === 'session',
      )?.id ?? null,
  );

  const wholeSessionDraft = async (): Promise<Segment | null> => {
    setPreparing(true);
    try {
      const records = await getSessionRecords(session.id);
      if (records.length < 2) return null;
      return segmentDraft({
        session,
        records,
        span: { startRecord: 0, endRecord: records.length - 1 },
        kind: 'session',
      });
    } catch {
      return null;
    } finally {
      setPreparing(false);
    }
  };

  return {
    available:
      session.hasDetailedRecords && sessionGps.data !== undefined && sessionGps.data !== null,
    referenceSegmentId,
    preparing,
    wholeSessionDraft,
  };
};
