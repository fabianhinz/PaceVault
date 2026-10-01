import type { SessionRecord } from '@/packages/engine/types.ts';

/**
 * Generate running records with GPS coordinates following a realistic path.
 * Starts from Munich (48.137, 11.575) by default and moves northeast.
 */
export const makeGPSRunningRecords = (
  count: number,
  options?: { startLat?: number; startLng?: number; baseHr?: number },
): SessionRecord[] => {
  const startLat = options?.startLat ?? 48.137;
  const startLng = options?.startLng ?? 11.575;
  const baseHr = options?.baseHr ?? 145;
  const records: SessionRecord[] = [];
  let cumulativeDistance = 0;

  for (let i = 0; i < count; i++) {
    const speed = 3.5 + 0.5 * Math.sin(i * 0.04);
    cumulativeDistance += speed;
    records.push({
      timestamp: i,
      lat: startLat + i * 0.0001,
      lng: startLng + i * 0.00015,
      speed,
      hr: baseHr + (i / count) * 15,
      elevation: 520 + 2 * Math.sin(i * 0.01),
      distance: cumulativeDistance,
    });
  }

  return records;
};

/**
 * Generate indoor records with no GPS data (lat/lng undefined).
 */
export const makeIndoorRecords = (count: number): SessionRecord[] => {
  const records: SessionRecord[] = [];
  for (let i = 0; i < count; i++) {
    records.push({
      timestamp: i,
      hr: 140 + (i / count) * 20,
      speed: 3.0,
      distance: i * 3.0,
    });
  }
  return records;
};
