import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { createIngestBatcher, INGEST_BATCH_SIZE } from '@/features/sessions/createIngestBatcher.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { PERSONAL_BESTS_KEY } from '@/features/records/hooks/usePersonalBests.ts';
import { getSessionRecords, getSessionLaps, getFitFile } from '@/lib/indexeddb.ts';
import { makeCyclingRecords, makeLaps } from '@tests/factories/records.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import type { ParsedFitResultWithMeta } from '@/parsers/fit.ts';

const ingestAll = async (parsed: ParsedFitResultWithMeta[], queryClient = new QueryClient()) => {
  const batcher = createIngestBatcher({ queryClient });
  for (const entry of parsed) await batcher.add(entry);
  return batcher.finish();
};

const makeParsed = (
  fingerprint: string,
  overrides?: Partial<ParsedFitResultWithMeta>,
): ParsedFitResultWithMeta => {
  const {
    id: _id,
    createdAt: _ca,
    source: _source,
    ...session
  } = makeSession({ name: `Ride ${fingerprint}`, fingerprint });
  return {
    session,
    records: makeCyclingRecords(30, { basePower: 200 }),
    laps: makeLaps(2),
    fingerprint,
    fileName: `${fingerprint}.fit`,
    rawData: new Uint8Array([1, 2, 3, 4]).buffer,
    source: { kind: 'file' },
    ...overrides,
  };
};

describe('createIngestBatcher', () => {
  it('adds sessions, writes records, laps and the raw FIT, and invalidates personal bests', async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const outcome = await ingestAll([makeParsed('fp-1'), makeParsed('fp-2')], queryClient);

    expect(outcome.importedCount).toBe(2);
    expect(outcome.duplicateCount).toBe(0);
    expect(outcome.saveFailed).toBe(false);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PERSONAL_BESTS_KEY, refetchType: 'all' });

    const first =
      useSessionsStore.getState().sessions.find((s) => s.name === 'Ride fp-1')?.id ?? '';
    expect(await getSessionRecords(first)).toHaveLength(30);
    expect(await getSessionLaps(first)).toHaveLength(2);

    const fit = await getFitFile(first);
    expect(fit?.fileName).toBe('fp-1.fit');
    expect(new Uint8Array(fit?.data ?? new ArrayBuffer(0))).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it('rejects a fingerprint that already exists in the store', async () => {
    const { id: _id, createdAt: _ca, ...session } = makeSession({ fingerprint: 'fp-1' });
    useSessionsStore.getState().addSessions([session]);

    const outcome = await ingestAll([makeParsed('fp-1'), makeParsed('fp-2')]);

    expect(outcome.importedCount).toBe(1);
    expect(outcome.duplicateCount).toBe(1);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
  });

  it('rejects a fingerprint repeated within the same batch', async () => {
    const outcome = await ingestAll([makeParsed('fp-1'), makeParsed('fp-1'), makeParsed('fp-2')]);

    expect(outcome.importedCount).toBe(2);
    expect(outcome.duplicateCount).toBe(1);
  });

  it('saves a full batch before finish and the remainder on finish', async () => {
    const batcher = createIngestBatcher({ queryClient: new QueryClient() });
    for (let i = 0; i <= INGEST_BATCH_SIZE; i++) await batcher.add(makeParsed(`fp-${i}`));

    expect(useSessionsStore.getState().sessions).toHaveLength(INGEST_BATCH_SIZE);

    const outcome = await batcher.finish();
    expect(outcome.importedCount).toBe(INGEST_BATCH_SIZE + 1);
    expect(useSessionsStore.getState().sessions).toHaveLength(INGEST_BATCH_SIZE + 1);
  });

  it('rejects a fingerprint already saved by an earlier batch', async () => {
    const parsed = Array.from({ length: INGEST_BATCH_SIZE }, (_, i) => makeParsed(`fp-${i}`));
    const outcome = await ingestAll([...parsed, makeParsed('fp-0')]);

    expect(outcome.importedCount).toBe(INGEST_BATCH_SIZE);
    expect(outcome.duplicateCount).toBe(1);
    expect(useSessionsStore.getState().sessions).toHaveLength(INGEST_BATCH_SIZE);
  });
});
