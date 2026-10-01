import { describe, it, expect } from 'vitest';
import { decodeRecords, encodeRecords } from '@/lib/recordCodec.ts';
import type { SessionRecord } from '@/packages/engine/types.ts';

const records: SessionRecord[] = Array.from({ length: 500 }, (_, i) => ({
  timestamp: i,
  hr: 140 + (i % 10),
  speed: 3.123,
  lat: 49.0160746,
  lng: 8.4182761,
  elevation: 116.6,
  distance: i * 3.12,
}));

describe('encodeRecords / decodeRecords', () => {
  it('round-trips records through gzip', async () => {
    const encoded = await encodeRecords(records);

    expect(encoded.format).toBe('gzip-json');
    expect(await decodeRecords(encoded)).toEqual(records);
  });

  it('returns no records for missing or corrupted entries', async () => {
    expect(await decodeRecords(undefined)).toEqual([]);
    expect(
      await decodeRecords({ format: 'gzip-json', data: new Uint8Array([1, 2, 3]).buffer }),
    ).toEqual([]);
  });
});
