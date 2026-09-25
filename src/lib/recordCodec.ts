import { z } from 'zod';
import type { SessionRecord } from '@/packages/engine/types.ts';

export type EncodedRecords =
  | { format: 'gzip-json'; data: ArrayBuffer }
  | { format: 'json'; records: SessionRecord[] };

const optNum = z.number().optional();

const sessionRecordsSchema = z.array(
  z.object({
    timestamp: z.number(),
    hr: optNum,
    power: optNum,
    cadence: optNum,
    speed: optNum,
    lat: optNum,
    lng: optNum,
    elevation: optNum,
    distance: optNum,
    grade: optNum,
    timerTime: optNum,
  }),
);

const encodedSchema = z.discriminatedUnion('format', [
  z.object({
    format: z.literal('gzip-json'),
    data: z.custom<ArrayBuffer>(
      (v) =>
        typeof v === 'object' &&
        v !== null &&
        'byteLength' in v &&
        typeof v.byteLength === 'number',
    ),
  }),
  z.object({ format: z.literal('json'), records: z.unknown() }),
]);

const canCompress = (): boolean =>
  typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

const pipe = async (
  bytes: Uint8Array<ArrayBuffer>,
  transform: GenericTransformStream,
): Promise<ArrayBuffer> => {
  const source = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start: (controller) => {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  return new Response(source.pipeThrough(transform)).arrayBuffer();
};

export const encodeRecords = async (records: SessionRecord[]): Promise<EncodedRecords> => {
  if (!canCompress()) return { format: 'json', records };
  const json = new TextEncoder().encode(JSON.stringify(records));
  return { format: 'gzip-json', data: await pipe(json, new CompressionStream('gzip')) };
};

const toRecords = (value: unknown): SessionRecord[] => {
  const parsed = sessionRecordsSchema.safeParse(value);
  if (!parsed.success) return [];
  return parsed.data;
};

export const decodeRecords = async (value: unknown): Promise<SessionRecord[]> => {
  const encoded = encodedSchema.safeParse(value);

  if (!encoded.success) return [];
  if (encoded.data.format === 'json') return toRecords(encoded.data.records);
  if (!canCompress()) return [];

  try {
    const bytes = await pipe(new Uint8Array(encoded.data.data), new DecompressionStream('gzip'));
    return toRecords(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return [];
  }
};
