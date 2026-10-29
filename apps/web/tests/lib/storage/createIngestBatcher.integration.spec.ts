import { afterEach, describe, it, expect, vi } from 'vite-plus/test';
import { QueryClient } from '@tanstack/react-query';
import { createIngestBatcher, INGEST_BATCH_SIZE } from '@/lib/storage/createIngestBatcher.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { personalBestsQueryKey } from '@/queries/records/usePersonalBests.ts';
import { getSessionRecords, getSessionLaps, getFitFile } from '@/lib/storage/db.ts';
import { cyclingRecordSeries, lapSeries } from '@pacevault/testing/series.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
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
  } = createMockTrainingSession({ name: `Ride ${fingerprint}`, fingerprint });
  return {
    session,
    records: cyclingRecordSeries({ count: 30, basePowerWatts: 200 }),
    laps: lapSeries(2),
    fingerprint,
    fileName: `${fingerprint}.fit`,
    rawData: new Uint8Array([1, 2, 3, 4]).buffer,
    source: { kind: 'file' },
    ...overrides,
  };
};

const stubPersistentStorage = () => {
  const persist = vi.fn(() => Promise.resolve(true));
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: { persisted: () => Promise.resolve(false), persist },
  });
  return persist;
};

describe(createIngestBatcher.name, () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'storage');
  });

  it('adds sessions, writes records, laps and the raw FIT, and invalidates personal bests', async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const outcome = await ingestAll([makeParsed('fp-1'), makeParsed('fp-2')], queryClient);

    expect(outcome.importedCount).toBe(2);
    expect(outcome.duplicateCount).toBe(0);
    expect(outcome.saveFailed).toBe(false);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: personalBestsQueryKey(),
      refetchType: 'all',
    });

    const first =
      useSessionsStore.getState().sessions.find((s) => s.name === 'Ride fp-1')?.id ?? '';
    expect(await getSessionRecords(first)).toHaveLength(30);
    expect(await getSessionLaps(first)).toHaveLength(2);

    const fit = await getFitFile(first);
    expect(fit?.fileName).toBe('fp-1.fit');
    expect(new Uint8Array(fit?.data ?? new ArrayBuffer(0))).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it('rejects a fingerprint that already exists in the store', async () => {
    const { createdAt: _ca, ...session } = createMockTrainingSession({ fingerprint: 'fp-1' });
    useSessionsStore.getState().addSessions({ sessions: [session] });

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

  it('a session whose data fails to save never appears in the list', async () => {
    const savable = Array.from({ length: 10 }, (_, i) => makeParsed(`fp-${i}`));
    const detached = new ArrayBuffer(8);
    structuredClone(detached, { transfer: [detached] });
    const unstorableFit = makeParsed('fp-broken', { rawData: detached });

    const outcome = await ingestAll([...savable, unstorableFit]);

    expect(outcome.saveFailed).toBe(true);
    expect(outcome.importedCount).toBe(10);
    const sessions = useSessionsStore.getState().sessions;
    expect(sessions.map((s) => s.fingerprint)).not.toContain('fp-broken');
    expect(sessions).toHaveLength(10);
    for (const session of sessions) {
      expect(await getFitFile(session.id)).toBeDefined();
    }
  });

  it('marks only sessions on or after markNewSince as new', async () => {
    const cutoff = new Date(2026, 1, 1, 10).getTime();
    const batcher = createIngestBatcher({ queryClient: new QueryClient(), markNewSince: cutoff });
    for (const [fingerprint, date] of [
      ['fp-before', cutoff - 1],
      ['fp-at', cutoff],
      ['fp-after', cutoff + 1],
    ] as const) {
      const parsed = makeParsed(fingerprint);
      await batcher.add({ ...parsed, session: { ...parsed.session, date } });
    }
    await batcher.finish();

    const newByName = Object.fromEntries(
      useSessionsStore.getState().sessions.map((s) => [s.name, s.isNew]),
    );
    expect(newByName).toEqual({
      'Ride fp-before': false,
      'Ride fp-at': true,
      'Ride fp-after': true,
    });
  });

  it('requests persistent storage after an import', async () => {
    const persist = stubPersistentStorage();

    await ingestAll([makeParsed('fp-1')]);

    await vi.waitFor(() => expect(persist).toHaveBeenCalledWith());
  });

  it('does not request persistent storage when nothing was imported', async () => {
    const persist = stubPersistentStorage();

    const outcome = await ingestAll([]);

    expect(outcome.importedCount).toBe(0);
    expect(persist).not.toHaveBeenCalled();
  });
});
