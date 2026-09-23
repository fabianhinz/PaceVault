import { describe, it, expect, vi } from 'vitest';
import { ingestParsedFits } from '@/features/sessions/ingestParsedFits.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useFiltersStore } from '@/store/filters.ts';
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
    records: makeCyclingRecords('tmp', 30, { basePower: 200 }),
    laps: makeLaps('tmp', 2),
    fingerprint,
    fileName: `${fingerprint}.fit`,
    rawData: new Uint8Array([1, 2, 3, 4]).buffer,
    source: { kind: 'file' },
    ...overrides,
  };
};

describe('ingestParsedFits', () => {
  it('adds sessions, writes records, laps and the raw FIT, and recomputes PBs', async () => {
    const spy = vi.spyOn(useFiltersStore.getState(), 'recomputePBs');

    const outcome = await ingestParsedFits([makeParsed('fp-1'), makeParsed('fp-2')]);

    expect(outcome.importedCount).toBe(2);
    expect(outcome.duplicateCount).toBe(0);
    expect(outcome.saveFailed).toBe(false);
    expect(outcome.sessionIds).toHaveLength(2);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
    expect(spy).toHaveBeenCalled();

    const first = outcome.sessionIds[0] ?? '';
    expect(await getSessionRecords(first)).toHaveLength(30);
    expect(await getSessionLaps(first)).toHaveLength(2);

    const fit = await getFitFile(first);
    expect(fit?.fileName).toBe('fp-1.fit');
    expect(new Uint8Array(fit?.data ?? new ArrayBuffer(0))).toEqual(new Uint8Array([1, 2, 3, 4]));

    spy.mockRestore();
  });

  it('rejects a fingerprint that already exists in the store', async () => {
    const { id: _id, createdAt: _ca, ...session } = makeSession({ fingerprint: 'fp-1' });
    useSessionsStore.getState().addSession(session);

    const outcome = await ingestParsedFits([makeParsed('fp-1'), makeParsed('fp-2')]);

    expect(outcome.importedCount).toBe(1);
    expect(outcome.duplicateCount).toBe(1);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
  });

  it('gives every session the source of its own entry', async () => {
    await ingestParsedFits([
      makeParsed('fp-1', { source: { kind: 'intervals', activityId: 'i1' } }),
      makeParsed('fp-2', { source: { kind: 'file' } }),
      makeParsed('fp-3', { source: { kind: 'intervals', activityId: 'i3' } }),
    ]);

    const byName = new Map(useSessionsStore.getState().sessions.map((s) => [s.name, s.source]));
    expect(byName.get('Ride fp-1')).toEqual({ kind: 'intervals', activityId: 'i1' });
    expect(byName.get('Ride fp-2')).toEqual({ kind: 'file' });
    expect(byName.get('Ride fp-3')).toEqual({ kind: 'intervals', activityId: 'i3' });
  });

  it('keeps the first source when a later copy is a duplicate', async () => {
    const { id: _id, createdAt: _ca, ...session } = makeSession({ fingerprint: 'fp-1' });
    useSessionsStore.getState().addSession(session);

    await ingestParsedFits([
      makeParsed('fp-1', { source: { kind: 'intervals', activityId: 'i1' } }),
    ]);

    expect(useSessionsStore.getState().sessions).toHaveLength(1);
    expect(useSessionsStore.getState().sessions[0]?.source).toEqual({ kind: 'file' });
  });

  it('rejects a fingerprint repeated within the same batch', async () => {
    const outcome = await ingestParsedFits([
      makeParsed('fp-1'),
      makeParsed('fp-1'),
      makeParsed('fp-2'),
    ]);

    expect(outcome.importedCount).toBe(2);
    expect(outcome.duplicateCount).toBe(1);
  });

  it('does nothing and reports no failure for an empty batch', async () => {
    const outcome = await ingestParsedFits([]);
    expect(outcome).toEqual({
      sessionIds: [],
      importedCount: 0,
      duplicateCount: 0,
      saveFailed: false,
    });
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('keeps the session name the parser produced', async () => {
    await ingestParsedFits([makeParsed('fp-1')]);
    expect(useSessionsStore.getState().sessions[0]?.name).toBe('Ride fp-1');
  });

  it('skips record writes for a session without detailed records', async () => {
    const outcome = await ingestParsedFits([makeParsed('fp-1', { records: [], laps: [] })]);

    expect(outcome.importedCount).toBe(1);
    expect(await getSessionRecords(outcome.sessionIds[0] ?? '')).toHaveLength(0);
  });
});
