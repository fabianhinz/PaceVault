import { v4 } from 'uuid';
import {
  matchTolerances,
  segmentReference,
  segmentReferenceFacts,
  type SegmentReferencePoint,
} from '@pacevault/engine/segments.ts';
import { degreesToRadians } from '@pacevault/engine/geodesy.ts';
import type { SessionRecord, TrainingSession } from '@pacevault/engine/types.ts';
import { buildSessionGPS, decodeTrackForRendering } from '@/lib/analysis/gpsTrack.ts';
import type { RecordSpan } from '@/lib/analysis/laps.ts';
import type { Segment, SegmentSourceKind } from '@/store/segments.ts';
import { formatSessionName } from '@/components/sessions/sessionTitleFormatter.ts';
import { segmentRangeName } from '@/microcopy/segments.ts';

interface PlanarPoint {
  xMeters: number;
  yMeters: number;
}

interface PlanarEdge {
  from: PlanarPoint;
  to: PlanarPoint;
  bearingDegrees: number;
}

interface LengthSample {
  point: PlanarPoint;
  bearingDegrees: number;
  lengthMeters: number;
}

interface PlanarBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface DraftGeometry {
  samples: LengthSample[];
  totalMeters: number;
  box: PlanarBox;
  metersPerDegreeLongitude: number;
  corridorMeters: number;
}

interface Overlap {
  segment: Segment;
  share: number;
}

const SAMPLE_STEP_METERS = 10;
const MIN_SIMILAR_SHARE = 0.5;
// Mirrors the matcher's same-direction bearing limit in packages/engine/src/segments.ts.
const MAX_SAME_DIRECTION_DEGREES = 60;
const METERS_PER_DEGREE_LATITUDE = 110540;
const METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR = 111320;

const referenceRecord = (point: SegmentReferencePoint): SessionRecord => ({
  timestamp: 0,
  lat: point.lat,
  lng: point.lng,
});

const planarPoints = ({
  encodedPolyline,
  metersPerDegreeLongitude,
}: {
  encodedPolyline: string;
  metersPerDegreeLongitude: number;
}): PlanarPoint[] =>
  decodeTrackForRendering(encodedPolyline).map((point) => ({
    xMeters: point[0] * metersPerDegreeLongitude,
    yMeters: point[1] * METERS_PER_DEGREE_LATITUDE,
  }));

const metersPerDegreeLongitudeOf = (encodedPolyline: string): number => {
  const latitudeDegrees = decodeTrackForRendering(encodedPolyline)[0]?.[1] ?? 0;
  return METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR * Math.cos(degreesToRadians(latitudeDegrees));
};

const edgesOf = (points: PlanarPoint[]): PlanarEdge[] =>
  points.slice(1).flatMap((to, i) => {
    const from = points[i];
    if (from === undefined || (from.xMeters === to.xMeters && from.yMeters === to.yMeters)) {
      return [];
    }
    const radians = Math.atan2(to.xMeters - from.xMeters, to.yMeters - from.yMeters);
    return [{ from, to, bearingDegrees: ((radians * 180) / Math.PI + 360) % 360 }];
  });

const edgeLengthMeters = (edge: PlanarEdge): number =>
  Math.hypot(edge.to.xMeters - edge.from.xMeters, edge.to.yMeters - edge.from.yMeters);

const samplesOf = (edges: PlanarEdge[]): LengthSample[] =>
  edges.flatMap((edge) => {
    const lengthMeters = edgeLengthMeters(edge);
    const count = Math.max(1, Math.ceil(lengthMeters / SAMPLE_STEP_METERS));
    return Array.from({ length: count }, (_, k) => {
      const fraction = (k + 0.5) / count;
      const point = {
        xMeters: edge.from.xMeters + (edge.to.xMeters - edge.from.xMeters) * fraction,
        yMeters: edge.from.yMeters + (edge.to.yMeters - edge.from.yMeters) * fraction,
      };
      return { point, bearingDegrees: edge.bearingDegrees, lengthMeters: lengthMeters / count };
    });
  });

const distanceToEdgeMeters = ({ point, edge }: { point: PlanarPoint; edge: PlanarEdge }) => {
  const dx = edge.to.xMeters - edge.from.xMeters;
  const dy = edge.to.yMeters - edge.from.yMeters;
  const along =
    ((point.xMeters - edge.from.xMeters) * dx + (point.yMeters - edge.from.yMeters) * dy) /
    (dx * dx + dy * dy);
  const fraction = Math.min(1, Math.max(0, along));
  return Math.hypot(
    edge.from.xMeters + dx * fraction - point.xMeters,
    edge.from.yMeters + dy * fraction - point.yMeters,
  );
};

const bearingDifferenceDegrees = (from: number, to: number): number => {
  const difference = Math.abs(from - to) % 360;
  if (difference > 180) return 360 - difference;
  return difference;
};

const coveredLengthMeters = ({
  samples,
  edges,
  corridorMeters,
}: {
  samples: LengthSample[];
  edges: PlanarEdge[];
  corridorMeters: number;
}): number =>
  samples.reduce((totalMeters, sample) => {
    const covered = edges.some(
      (edge) =>
        bearingDifferenceDegrees(sample.bearingDegrees, edge.bearingDegrees) <=
          MAX_SAME_DIRECTION_DEGREES &&
        distanceToEdgeMeters({ point: sample.point, edge }) <= corridorMeters,
    );
    if (!covered) return totalMeters;
    return totalMeters + sample.lengthMeters;
  }, 0);

const boxAround = ({ points, marginMeters }: { points: PlanarPoint[]; marginMeters: number }) => {
  const xs = points.map((point) => point.xMeters);
  const ys = points.map((point) => point.yMeters);
  return {
    minX: Math.min(...xs) - marginMeters,
    maxX: Math.max(...xs) + marginMeters,
    minY: Math.min(...ys) - marginMeters,
    maxY: Math.max(...ys) + marginMeters,
  };
};

const edgeTouchesBox = ({ edge, box }: { edge: PlanarEdge; box: PlanarBox }): boolean =>
  Math.max(edge.from.xMeters, edge.to.xMeters) >= box.minX &&
  Math.min(edge.from.xMeters, edge.to.xMeters) <= box.maxX &&
  Math.max(edge.from.yMeters, edge.to.yMeters) >= box.minY &&
  Math.min(edge.from.yMeters, edge.to.yMeters) <= box.maxY;

const draftGeometryOf = (segment: Segment): DraftGeometry => {
  const metersPerDegreeLongitude = metersPerDegreeLongitudeOf(segment.encodedPolyline);
  const corridorMeters = matchTolerances(segment.distanceMeters).corridorMeters;
  const points = planarPoints({
    encodedPolyline: segment.encodedPolyline,
    metersPerDegreeLongitude,
  });
  const samples = samplesOf(edgesOf(points));
  return {
    samples,
    totalMeters: samples.reduce((sumMeters, sample) => sumMeters + sample.lengthMeters, 0),
    box: boxAround({ points, marginMeters: corridorMeters }),
    metersPerDegreeLongitude,
    corridorMeters,
  };
};

const overlapShare = ({ draft, candidate }: { draft: DraftGeometry; candidate: Segment }) => {
  const edges = edgesOf(
    planarPoints({
      encodedPolyline: candidate.encodedPolyline,
      metersPerDegreeLongitude: draft.metersPerDegreeLongitude,
    }),
  ).filter((edge) => edgeTouchesBox({ edge, box: draft.box }));
  const coveredMeters = coveredLengthMeters({
    samples: draft.samples,
    edges,
    corridorMeters: draft.corridorMeters,
  });
  return coveredMeters / draft.totalMeters;
};

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

// The existing same-sport segment whose stored polyline runs, in the same direction and within the matcher's corridor, along the largest share of the draft's length.
export const similarSegment = ({
  segment,
  segments,
}: {
  segment: Segment;
  segments: Segment[];
}): Segment | undefined => {
  const draft = draftGeometryOf(segment);
  if (draft.totalMeters === 0) return undefined;
  const overlaps: Overlap[] = segments
    .filter((candidate) => candidate.id !== segment.id && candidate.sport === segment.sport)
    .map((candidate) => ({ segment: candidate, share: overlapShare({ draft, candidate }) }))
    .filter((overlap) => overlap.share >= MIN_SIMILAR_SHARE)
    .sort((a, b) => b.share - a.share);
  return overlaps[0]?.segment;
};
