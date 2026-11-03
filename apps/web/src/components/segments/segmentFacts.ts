import { formatDistance, formatNumber } from '@/lib/format/formatters.ts';
import type { Segment } from '@/lib/workers/segmentsContract.ts';

const signedMeters = (meters: number): string => {
  const rounded = Math.round(meters);
  if (rounded > 0) return `+${formatNumber(rounded)} m`;
  if (rounded < 0) return `−${formatNumber(-rounded)} m`;
  return `${formatNumber(0)} m`;
};

export const segmentFacts = (segment: Segment): string[] => {
  const facts = [formatDistance(segment.distanceMeters)];
  if (segment.netElevationMeters !== null) facts.push(signedMeters(segment.netElevationMeters));
  return facts;
};
