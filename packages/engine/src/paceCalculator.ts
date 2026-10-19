// App-specific logic — no published formula.
// See packages/engine/SOURCES.md (App-Specific Logic section).

/**
 * Computes total time from pace and distance.
 * @param paceSecPerKm - Pace in seconds per kilometre.
 * @param distanceMeters - Distance in metres.
 * @returns Duration in seconds.
 */
export const timeFromPaceAndDistance = (paceSecPerKm: number, distanceMeters: number): number =>
  paceSecPerKm * (distanceMeters / 1000);

/**
 * Computes pace from distance and time.
 * @param distanceMeters - Distance in metres.
 * @param timeSeconds - Duration in seconds.
 * @returns Pace in seconds per kilometre.
 */
export const paceFromDistanceAndTime = (distanceMeters: number, timeSeconds: number): number =>
  timeSeconds / (distanceMeters / 1000);

/**
 * Computes distance from pace and time.
 * @param paceSecPerKm - Pace in seconds per kilometre.
 * @param timeSeconds - Duration in seconds.
 * @returns Distance in metres.
 */
export const distanceFromPaceAndTime = (paceSecPerKm: number, timeSeconds: number): number =>
  (timeSeconds / paceSecPerKm) * 1000;
