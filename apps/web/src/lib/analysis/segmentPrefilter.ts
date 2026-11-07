import { decode } from '@googlemaps/polyline-codec';
import { degreesToRadians } from '@pacevault/engine/geodesy.ts';
import {
  matchTolerances,
  segmentReferenceFacts,
  type SegmentReferencePoint,
} from '@pacevault/engine/segments.ts';

interface PlanarPoint {
  xMeters: number;
  yMeters: number;
}

const METERS_PER_DEGREE_LATITUDE = 110540;
const METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR = 111320;
const SIMPLIFIED_POLYLINE_MARGIN_METERS = 10;

const planarPoint = ({
  lat,
  lng,
  metersPerDegreeLongitude,
}: {
  lat: number;
  lng: number;
  metersPerDegreeLongitude: number;
}): PlanarPoint => ({
  xMeters: lng * metersPerDegreeLongitude,
  yMeters: lat * METERS_PER_DEGREE_LATITUDE,
});

const distanceToSegmentMeters = ({
  target,
  from,
  to,
}: {
  target: PlanarPoint;
  from: PlanarPoint;
  to: PlanarPoint;
}): number => {
  const dx = to.xMeters - from.xMeters;
  const dy = to.yMeters - from.yMeters;
  const lengthSquared = dx * dx + dy * dy;
  let fraction = 0;
  if (lengthSquared > 0) {
    const along =
      ((target.xMeters - from.xMeters) * dx + (target.yMeters - from.yMeters) * dy) / lengthSquared;
    fraction = Math.min(1, Math.max(0, along));
  }
  return Math.hypot(
    from.xMeters + dx * fraction - target.xMeters,
    from.yMeters + dy * fraction - target.yMeters,
  );
};

const passesNear = ({
  line,
  target,
  toleranceMeters,
}: {
  line: PlanarPoint[];
  target: PlanarPoint;
  toleranceMeters: number;
}): boolean =>
  line.some((from, i) => {
    const to = line[i + 1] ?? from;
    return distanceToSegmentMeters({ target, from, to }) <= toleranceMeters;
  });

export const reachesSegmentEnds = ({
  encodedPolyline,
  reference,
}: {
  encodedPolyline: string;
  reference: SegmentReferencePoint[];
}): boolean => {
  const first = reference[0];
  const last = reference.at(-1);
  if (first === undefined || last === undefined) return false;
  const metersPerDegreeLongitude =
    METERS_PER_DEGREE_LONGITUDE_AT_EQUATOR * Math.cos(degreesToRadians(first.lat));
  const toleranceMeters =
    matchTolerances(segmentReferenceFacts(reference).distanceMeters).endToleranceMeters +
    SIMPLIFIED_POLYLINE_MARGIN_METERS;
  const line = decode(encodedPolyline).map(([lat, lng]) =>
    planarPoint({ lat, lng, metersPerDegreeLongitude }),
  );
  return [first, last].every((end) =>
    passesNear({
      line,
      target: planarPoint({ lat: end.lat, lng: end.lng, metersPerDegreeLongitude }),
      toleranceMeters,
    }),
  );
};
