// Sources: [Veness2019]
// See packages/engine/SOURCES.md for full citations.

import type { GPSPoint } from './types.ts';

export const EARTH_RADIUS_METERS = 6371000;

export const isValidCoordinate = (point: {
  lat?: number | null;
  lng?: number | null;
}): point is { lat: number; lng: number } =>
  point.lat != null &&
  point.lng != null &&
  point.lat >= -90 &&
  point.lat <= 90 &&
  point.lng >= -180 &&
  point.lng <= 180;

export const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** @see [Veness2019] — standard haversine formula. */
export const haversineDistanceMeters = ({ from, to }: { from: GPSPoint; to: GPSPoint }): number => {
  const dLat = degreesToRadians(to.lat - from.lat);
  const dLng = degreesToRadians(to.lng - from.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const haversine =
    sinLat * sinLat +
    Math.cos(degreesToRadians(from.lat)) * Math.cos(degreesToRadians(to.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
};

/** @see [Veness2019] — standard initial-bearing formula. */
export const initialBearingDegrees = ({ from, to }: { from: GPSPoint; to: GPSPoint }): number => {
  const lat1 = degreesToRadians(from.lat);
  const lat2 = degreesToRadians(to.lat);
  const dLng = degreesToRadians(to.lng - from.lng);
  const eastComponent = Math.sin(dLng) * Math.cos(lat2);
  const northComponent =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(eastComponent, northComponent) * (180 / Math.PI) + 360) % 360;
};
