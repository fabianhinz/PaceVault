import { describe, it, expect } from 'vite-plus/test';
import { pickBoundsFromCorners, filterTracksByPickBounds } from '@/features/map/trackPicking.ts';
import type { PickableTrack } from '@/features/map/trackPicking.ts';
import type { GPSBounds } from '@pacevault/engine/types.ts';

describe(pickBoundsFromCorners.name, () => {
  it('normalizes corners regardless of order', () => {
    const a = { lat: 50, lng: 10 };
    const b = { lat: 48, lng: 12 };
    const bounds = pickBoundsFromCorners(a, b);
    expect(bounds).toEqual({
      minLat: 48,
      maxLat: 50,
      minLng: 10,
      maxLng: 12,
    });
  });

  it('normalizes when b is above-left of a', () => {
    const a = { lat: 48, lng: 12 };
    const b = { lat: 50, lng: 10 };
    const bounds = pickBoundsFromCorners(a, b);
    expect(bounds).toEqual({
      minLat: 48,
      maxLat: 50,
      minLng: 10,
      maxLng: 12,
    });
  });

  it('handles zero-area bounds when corners are identical', () => {
    const a = { lat: 49, lng: 11 };
    const bounds = pickBoundsFromCorners(a, a);
    expect(bounds.minLat).toBe(bounds.maxLat);
    expect(bounds.minLng).toBe(bounds.maxLng);
  });
});

describe(filterTracksByPickBounds.name, () => {
  const pickBounds: GPSBounds = {
    minLat: 48,
    maxLat: 50,
    minLng: 10,
    maxLng: 12,
  };

  const makeTrack = (
    sessionId: string,
    bounds: GPSBounds,
    path: [number, number][],
  ): PickableTrack => ({ sessionId, bounds, path });

  it('returns sessionId for a track that crosses the pick bounds', () => {
    const track = makeTrack('s1', { minLat: 47, maxLat: 51, minLng: 9, maxLng: 13 }, [
      [11, 47],
      [11, 51],
    ]);
    expect(filterTracksByPickBounds({ tracks: [track], pickBounds })).toEqual(['s1']);
  });

  it('returns empty for a track that misses the pick bounds', () => {
    const track = makeTrack('s1', { minLat: 52, maxLat: 54, minLng: 10, maxLng: 12 }, [
      [11, 52],
      [11, 54],
    ]);
    expect(filterTracksByPickBounds({ tracks: [track], pickBounds })).toEqual([]);
  });

  it('returns empty when bounds overlap but no segment intersects', () => {
    // Track bounds overlap with pick bounds, but the actual path
    // runs outside the pick area (only in the overlapping bounds corner)
    const track = makeTrack('s1', { minLat: 47, maxLat: 49, minLng: 9, maxLng: 11 }, [
      [9.5, 47.5],
      [9.5, 47.8],
    ]);
    expect(filterTracksByPickBounds({ tracks: [track], pickBounds })).toEqual([]);
  });

  it('deduplicates multiple tracks with the same sessionId', () => {
    const trackA = makeTrack('s1', { minLat: 47, maxLat: 51, minLng: 9, maxLng: 13 }, [
      [11, 47],
      [11, 51],
    ]);
    const trackB = makeTrack('s1', { minLat: 47, maxLat: 51, minLng: 9, maxLng: 13 }, [
      [11.5, 48],
      [11.5, 50],
    ]);
    const result = filterTracksByPickBounds({ tracks: [trackA, trackB], pickBounds });
    expect(result).toEqual(['s1']);
  });

  it('returns empty for empty tracks array', () => {
    expect(filterTracksByPickBounds({ tracks: [], pickBounds })).toEqual([]);
  });

  it('returns multiple session ids for multiple hitting tracks', () => {
    const trackA = makeTrack('s1', { minLat: 47, maxLat: 51, minLng: 9, maxLng: 13 }, [
      [11, 47],
      [11, 51],
    ]);
    const trackB = makeTrack('s2', { minLat: 48, maxLat: 50, minLng: 10, maxLng: 12 }, [
      [10.5, 49],
      [11.5, 49],
    ]);
    const result = filterTracksByPickBounds({ tracks: [trackA, trackB], pickBounds });
    expect(result).toEqual(['s1', 's2']);
  });
});
