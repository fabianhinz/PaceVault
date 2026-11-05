import { formatDistance } from '@/lib/format/formatters.ts';
import { railGain, railInt, railLoss } from '@/components/charts/railFormat.ts';
import type { Segment } from '@/store/segments.ts';
import { LABEL_BY_SPORT } from '@/microcopy/sports.ts';

const signedMeters = (meters: number): string => {
  const rounded = Math.round(meters);
  if (rounded > 0) return `${railGain(rounded)} m`;
  if (rounded < 0) return `${railLoss(-rounded)} m`;
  return `${railInt(rounded)} m`;
};

export const segmentFacts = (
  segment: Pick<Segment, 'distanceMeters' | 'netElevationMeters'>,
): string[] => {
  const facts = [formatDistance(segment.distanceMeters)];
  if (segment.netElevationMeters !== null) facts.push(signedMeters(segment.netElevationMeters));
  return facts;
};

export const segmentFactsLine = (
  segment: Pick<Segment, 'sport' | 'distanceMeters' | 'netElevationMeters'>,
): string => [LABEL_BY_SPORT[segment.sport](), ...segmentFacts(segment)].join(' · ');
