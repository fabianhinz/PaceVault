import { scaleLinear } from 'd3-scale';
import type { SessionRecord } from '@/packages/engine/types.ts';
import { ZONE_PALETTES, type ColorScale } from '@/lib/zoneColors.ts';

export const SPEED_PALETTE = ZONE_PALETTES.pace;

const SLOW_PERCENTILE = 0.05;
const FAST_PERCENTILE = 0.99;

export interface SpeedScale extends ColorScale {
  slowKmh: number;
  fastKmh: number;
}

export const percentile = (sorted: number[], fraction: number): number | undefined => {
  const position = (sorted.length - 1) * fraction;
  const lower = sorted[Math.floor(position)];
  const upper = sorted[Math.ceil(position)];
  if (lower === undefined || upper === undefined) return undefined;
  return lower + (upper - lower) * (position - Math.floor(position));
};

const movingSpeedsKmh = (records: SessionRecord[]): number[] => {
  const speeds: number[] = [];
  for (const record of records) {
    if (record.speed !== undefined && record.speed > 0) speeds.push(record.speed * 3.6);
  }
  return speeds.sort((a, b) => a - b);
};

const evenDomain = (slow: number, fast: number): number[] => {
  const steps = SPEED_PALETTE.length - 1;
  return SPEED_PALETTE.map((_, index) => slow + ((fast - slow) * index) / steps);
};

export const hasMovingSpeed = (records: SessionRecord[]): boolean =>
  records.some((record) => record.speed !== undefined && record.speed > 0);

export const speedScale = (records: SessionRecord[]): SpeedScale | undefined => {
  const moving = movingSpeedsKmh(records);
  const slowKmh = percentile(moving, SLOW_PERCENTILE);
  const fastKmh = percentile(moving, FAST_PERCENTILE);
  if (slowKmh === undefined || fastKmh === undefined) return undefined;
  if (fastKmh <= slowKmh) {
    const middle = SPEED_PALETTE[Math.floor(SPEED_PALETTE.length / 2)] ?? SPEED_PALETTE[0] ?? '';
    return { slowKmh, fastKmh, domain: [slowKmh], colorAt: () => middle };
  }
  const domain = evenDomain(slowKmh, fastKmh);
  const blend = scaleLinear<string>().domain(domain).range(SPEED_PALETTE).clamp(true);
  return { slowKmh, fastKmh, domain, colorAt: (value) => blend(value) };
};
