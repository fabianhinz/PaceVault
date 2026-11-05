import { v4 } from 'uuid';
import {
  matchTolerances,
  segmentReference,
  segmentReferenceFacts,
  type SegmentReferencePoint,
} from '@pacevault/engine/segments.ts';
import { haversineDistanceMeters } from '@pacevault/engine/geodesy.ts';
import type { GPSPoint, SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { buildSessionGPS, decodeTrackForRendering } from '@/lib/analysis/gpsTrack.ts';
import type { RecordSpan } from '@/lib/analysis/laps.ts';
import type { Segment, SegmentSourceKind } from '@/store/segments.ts';
import { formatSessionName } from '@/components/sessions/sessionTitleFormatter.ts';
import { segmentRangeName } from '@/microcopy/segments.ts';

interface SegmentEnds {
  start: GPSPoint;
  end: GPSPoint;
}

const SAME_STRETCH_LENGTH_RATIO = 0.1;

const referenceRecord = (point: SegmentReferencePoint): SessionRecord => ({
  timestamp: 0,
  lat: point.lat,
  lng: point.lng,
});

const endsOf = (encodedPolyline: string): SegmentEnds | undefined => {
  const points = decodeTrackForRendering(encodedPolyline);
  const first = points[0];
  const last = points[points.length - 1];
  if (first === undefined || last === undefined) return undefined;
  return { start: { lat: first[1], lng: first[0] }, end: { lat: last[1], lng: last[0] } };
};

const sameEnds = ({
  draft,
  candidate,
  toleranceMeters,
}: {
  draft: SegmentEnds;
  candidate: SegmentEnds;
  toleranceMeters: number;
}): boolean =>
  haversineDistanceMeters({ from: draft.start, to: candidate.start }) <= toleranceMeters &&
  haversineDistanceMeters({ from: draft.end, to: candidate.end }) <= toleranceMeters;

const sameLength = ({ draft, candidate }: { draft: Segment; candidate: Segment }): boolean =>
  Math.abs(candidate.distanceMeters - draft.distanceMeters) <=
  SAME_STRETCH_LENGTH_RATIO * draft.distanceMeters;

export const suggestedSegmentName = ({
  session,
  kind,
  startMeters,
  endMeters,
}: {
  session: TrainingSession;
  kind: SegmentSourceKind;
  startMeters: number;
  endMeters: number;
}): string => {
  const name = formatSessionName(session);
  if (kind === 'session') return name;
  return segmentRangeName({ name, startMeters, endMeters });
};

export const segmentDraft = ({
  session,
  records,
  span,
  kind,
}: {
  session: TrainingSession;
  records: SessionRecord[];
  span: RecordSpan;
  kind: SegmentSourceKind;
}): Segment | null => {
  const slice = records.slice(span.startRecord, span.endRecord + 1);
  const first = slice[0];
  const last = slice[slice.length - 1];
  const id = v4();
  const reference = segmentReference(slice);
  const gps = buildSessionGPS({ sessionId: id, records: reference.map(referenceRecord) });
  const referenceStart = reference[0];
  const referenceEnd = reference[reference.length - 1];
  if (first === undefined || last === undefined || gps === null) return null;
  if (referenceStart === undefined || referenceEnd === undefined || reference.length < 2) {
    return null;
  }
  const facts = segmentReferenceFacts(reference);
  return {
    id,
    name: suggestedSegmentName({
      session,
      kind,
      startMeters: referenceStart.distanceMeters,
      endMeters: referenceEnd.distanceMeters,
    }),
    sport: session.sport,
    source: { sessionId: session.id, kind, startSec: first.timestamp, endSec: last.timestamp },
    distanceMeters: facts.distanceMeters,
    netElevationMeters: facts.netElevationMeters,
    encodedPolyline: gps.encodedPolyline,
    bounds: gps.bounds,
    createdAt: Date.now(),
  };
};

export const similarSegment = ({
  segment,
  segments,
}: {
  segment: Segment;
  segments: Segment[];
}): Segment | undefined => {
  const draftEnds = endsOf(segment.encodedPolyline);
  if (draftEnds === undefined) return undefined;
  const toleranceMeters = matchTolerances(segment.distanceMeters).endToleranceMeters;
  return segments.find((candidate) => {
    if (candidate.id === segment.id || candidate.sport !== segment.sport) return false;
    if (!sameLength({ draft: segment, candidate })) return false;
    const candidateEnds = endsOf(candidate.encodedPolyline);
    if (candidateEnds === undefined) return false;
    return sameEnds({ draft: draftEnds, candidate: candidateEnds, toleranceMeters });
  });
};
