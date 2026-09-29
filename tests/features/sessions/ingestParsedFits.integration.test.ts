import { describe, it, expect, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { ingestParsedFits } from '@/features/sessions/ingestParsedFits.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { PERSONAL_BESTS_KEY } from '@/features/records/hooks/usePersonalBests.ts';
import { getSessionRecords, getSessionLaps, getFitFile } from '@/lib/indexeddb.ts';
import { makeCyclingRecords, makeLaps } from '@tests/factories/records.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import type { ParsedFitResultWithMeta } from '@/parsers/fit.ts';

const makeParsed = (
  fingerprint: string,
  overrides?: Partial<ParsedFitResultWithMeta>,
): ParsedFitResultWithMeta => {
  const {
    id: _id,
    createdAt: _ca,
    source: _source,
    ...session
  } = makeSession({ name: `Ride ${fingerprint}` });
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

describe('ingestParsedFits', () => {
  it('adds sessions, writes records, laps and the raw FIT, and invalidates personal bests', async () => {
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const outcome = await ingestParsedFits([makeParsed('fp-1'), makeParsed('fp-2')], {
      queryClient,
    });

    expect(outcome.importedCount).toBe(2);
    expect(outcome.duplicateCount).toBe(0);
    expect(outcome.saveFailed).toBe(false);
    expect(outcome.sessionIds).toHaveLength(2);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PERSONAL_BESTS_KEY, refetchType: 'all' });

    const first = outcome.sessionIds[0] ?? '';
    expect(await getSessionRecords(first)).toHaveLength(30);
    expect(await getSessionLaps(first)).toHaveLength(2);

    const fit = await getFitFile(first);
    expect(fit?.fileName).toBe('fp-1.fit');
    expect(new Uint8Array(fit?.data ?? new ArrayBuffer(0))).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it('rejects a fingerprint that already exists in the store', async () => {
    const { id: _id, createdAt: _ca, ...session } = makeSession({ fingerprint: 'fp-1' });
    useSessionsStore.getState().addSession(session);

    const outcome = await ingestParsedFits([makeParsed('fp-1'), makeParsed('fp-2')], {
      queryClient: new QueryClient(),
    });

    expect(outcome.importedCount).toBe(1);
    expect(outcome.duplicateCount).toBe(1);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
  });

  it('rejects a fingerprint repeated within the same batch', async () => {
    const outcome = await ingestParsedFits(
      [makeParsed('fp-1'), makeParsed('fp-1'), makeParsed('fp-2')],
      { queryClient: new QueryClient() },
    );

    expect(outcome.importedCount).toBe(2);
    expect(outcome.duplicateCount).toBe(1);
  });
});
