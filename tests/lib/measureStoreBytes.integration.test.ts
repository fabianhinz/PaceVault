import { describe, it, expect } from 'vitest';
import { measureStoreBytes, saveFitFile, saveSessionGPS } from '@/lib/indexeddb.ts';

describe('measureStoreBytes', () => {
  it('counts FIT files by their byte length and other stores by their serialised size', async () => {
    await saveFitFile('s1', 'ride.fit', new Uint8Array(1234).buffer);
    await saveSessionGPS({
      sessionId: 's1',
      encodedPolyline: 'abcdefghij',
      pointCount: 10,
      bounds: { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 },
    });

    const sizes = await measureStoreBytes();

    expect(sizes['fit-files']).toBe(1234);
    expect(sizes['session-gps']).toBeGreaterThan(10);
    expect(sizes['session-weather']).toBe(0);
  });
});
