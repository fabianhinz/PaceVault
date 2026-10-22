import { decodeTrackForRendering } from '@pacevault/engine/gps.ts';
import type { MapTrack } from './useMapTracks';

export const PICK_RADIUS = 25;

const pathCache = new Map<string, [number, number][]>();

export const decodeCached = (sessionId: string, encoded: string): [number, number][] => {
  let path = pathCache.get(sessionId);
  if (!path) {
    path = decodeTrackForRendering(encoded);
    pathCache.set(sessionId, path);
  }
  return path;
};

export interface TrackPickData {
  sessionId: string;
  track: MapTrack;
  path: [number, number][];
}
