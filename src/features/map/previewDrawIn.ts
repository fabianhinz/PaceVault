import { decode } from '@googlemaps/polyline-codec';
import type { GPSBounds, Sport } from '@/packages/engine/types.ts';
import { haversineM } from '@/packages/engine/gps.ts';
import { createSeededRandom } from '@/features/demo/seededRandom.ts';

interface PreviewRoute {
  sport: Sport;
  polyline: string;
}

export interface PreviewPass {
  sport: Sport;
  /** [lng, lat] pairs. */
  path: [number, number][];
  /** Cumulative distance in metres at each point. */
  cumulative: number[];
  length: number;
  /** Delay in ms after the reveal before this pass starts drawing. */
  start: number;
  duration: number;
}

export interface PreviewPasses {
  passes: PreviewPass[];
  bounds: GPSBounds | null;
}

const JITTER_SEED = 7;
const STAGGER_SEED = 3;
const JITTER_M = 22;
const METRES_PER_DEGREE = 111_320;
const STAGGER_SPREAD_MS = 1800;
const MIN_DURATION_MS = 1600;
const MAX_DURATION_MS = 2400;

const cumulativeOf = (path: [number, number][]): number[] => {
  const cumulative: number[] = [];
  let total = 0;
  let previous: [number, number] | undefined = undefined;
  for (const point of path) {
    if (previous !== undefined) {
      total += haversineM({ lat: previous[1], lng: previous[0] }, { lat: point[1], lng: point[0] });
    }
    cumulative.push(total);
    previous = point;
  }
  return cumulative;
};

// A smoothed random walk, so the second pass runs alongside the first like another recording.
const jitterPath = (path: [number, number][], next: () => number): [number, number][] => {
  let offsetLat = (next() - 0.5) * (JITTER_M / METRES_PER_DEGREE);
  let offsetLng = (next() - 0.5) * (JITTER_M / METRES_PER_DEGREE);
  return path.map((point) => {
    const unitLat = JITTER_M / METRES_PER_DEGREE;
    const unitLng = JITTER_M / (METRES_PER_DEGREE * Math.cos((point[1] * Math.PI) / 180));
    offsetLat = offsetLat * 0.8 + (next() - 0.5) * unitLat * 0.6;
    offsetLng = offsetLng * 0.8 + (next() - 0.5) * unitLng * 0.6;
    return [point[0] + offsetLng, point[1] + offsetLat];
  });
};

const boundsOf = (passes: PreviewPass[]): GPSBounds | null => {
  let bounds: GPSBounds | null = null;
  for (const pass of passes) {
    for (const point of pass.path) {
      if (bounds === null) {
        bounds = { minLng: point[0], maxLng: point[0], minLat: point[1], maxLat: point[1] };
        continue;
      }
      bounds.minLng = Math.min(bounds.minLng, point[0]);
      bounds.maxLng = Math.max(bounds.maxLng, point[0]);
      bounds.minLat = Math.min(bounds.minLat, point[1]);
      bounds.maxLat = Math.max(bounds.maxLat, point[1]);
    }
  }
  return bounds;
};

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Two passes per route (the original plus a jittered copy, so overlaps build heat),
 * each with a staggered start and its own duration. Deterministic for the same input.
 */
export const buildPreviewPasses = (routes: PreviewRoute[]): PreviewPasses => {
  const jitter = createSeededRandom(JITTER_SEED);
  const drafts: Omit<PreviewPass, 'start' | 'duration'>[] = [];
  for (let round = 0; round < 2; round++) {
    for (const route of routes) {
      const original = decode(route.polyline, 5).map((point): [number, number] => [
        point[1],
        point[0],
      ]);
      if (original.length < 2) continue;
      let path = original;
      if (round > 0) path = jitterPath(original, jitter.next);
      const cumulative = cumulativeOf(path);
      drafts.push({ sport: route.sport, path, cumulative, length: cumulative.at(-1) ?? 0 });
    }
  }

  const stagger = createSeededRandom(STAGGER_SEED);
  const order = drafts
    .map((draft) => ({ draft, key: stagger.next() }))
    .sort((a, b) => a.key - b.key);
  const passes = order.map((entry, i): PreviewPass => {
    const start = (i / order.length) * STAGGER_SPREAD_MS;
    const duration = stagger.between(MIN_DURATION_MS, MAX_DURATION_MS);
    return { ...entry.draft, start, duration };
  });
  return { passes, bounds: boundsOf(passes) };
};

/** When the last pass has finished drawing, in ms after the reveal. */
export const previewDrawInEnd = (passes: PreviewPass[]): number => {
  let end = 0;
  for (const pass of passes) end = Math.max(end, pass.start + pass.duration);
  return end;
};

/** The drawn prefix of a pass at `elapsedMs` after the reveal, ending on an interpolated point. */
export const slicePath = (pass: PreviewPass, elapsedMs: number): [number, number][] => {
  const t = (elapsedMs - pass.start) / pass.duration;
  if (t <= 0) return [];
  if (t >= 1 || pass.length === 0) return pass.path;
  const target = easeOutCubic(t) * pass.length;
  const prefix: [number, number][] = [];
  for (let i = 0; i < pass.path.length; i++) {
    const point = pass.path[i];
    const at = pass.cumulative[i];
    if (point === undefined || at === undefined) break;
    if (at <= target) {
      prefix.push(point);
      continue;
    }
    const previous = pass.path[i - 1];
    const previousAt = pass.cumulative[i - 1];
    if (previous !== undefined && previousAt !== undefined && at > previousAt) {
      const f = (target - previousAt) / (at - previousAt);
      prefix.push([
        previous[0] + (point[0] - previous[0]) * f,
        previous[1] + (point[1] - previous[1]) * f,
      ]);
    }
    break;
  }
  return prefix;
};
