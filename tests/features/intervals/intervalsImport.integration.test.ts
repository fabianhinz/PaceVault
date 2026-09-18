import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runIntervalsImport } from '@/features/intervals/runIntervalsImport.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { getSessionRecords, getFitFile } from '@/lib/indexeddb.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';
import type { UserProfile } from '@/types/index.ts';

const fixture = (name: string): ArrayBuffer => {
  const buf = readFileSync(resolve(`e2e/fixtures/${name}`));
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(buf);
  return bytes.buffer;
};

const LISTING = [
  {
    id: 'i100',
    name: 'Karlsruhe Laufen',
    type: 'Run',
    source: 'GARMIN_CONNECT',
    file_type: 'fit',
    start_date_local: '2026-08-21T18:27:19',
  },
  {
    id: 'i200',
    name: 'Gruppetto hin, zu zweit zurück',
    type: 'Ride',
    source: 'GARMIN_CONNECT',
    file_type: 'fit',
    start_date_local: '2026-08-22T09:03:33',
  },
  {
    id: 'i300',
    name: null,
    type: null,
    source: 'STRAVA',
    file_type: null,
    _note: 'STRAVA activities are not available via the API',
  },
  {
    id: 'i400',
    name: 'Morning Swim',
    type: 'Swim',
    source: 'GARMIN_CONNECT',
    file_type: 'fit',
    start_date_local: '2026-08-19T07:00:00',
  },
];

const FILES: Record<string, string> = { i100: 'running.fit', i200: 'cycling.fit' };

const profile = (): UserProfile => makeUserProfile();

const WINDOW = { oldest: '2026-08-01', newest: '2026-08-31' };

interface CallLog {
  listings: number;
  files: string[];
}

const stubApi = (): CallLog => {
  const log: CallLog = { listings: 0, files: [] };

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = input;

      if (url.includes('/activities')) {
        log.listings++;
        return new Response(JSON.stringify(LISTING), { status: 200 });
      }

      const match = /\/activity\/(\w+)\//.exec(url);
      const id = match?.[1] ?? '';
      log.files.push(id);

      const file = FILES[id];
      if (file === undefined) {
        return new Response(
          JSON.stringify({ error: 'Cannot read Strava activities via the API' }),
          {
            status: 422,
          },
        );
      }
      return new Response(fixture(file), { status: 200 });
    }),
  );

  return log;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runIntervalsImport', () => {
  it('imports supported activities and names them from the listing, not the filename', async () => {
    stubApi();

    const result = await runIntervalsImport({
      apiKey: 'secret-key',
      profile: profile(),
      window: WINDOW,
      knownActivityIds: [],
    });

    expect(result.fatal).toBeUndefined();
    expect(result.imported).toBe(2);
    expect(result.failed).toBe(0);
    expect([...result.importedActivityIds].sort((a, b) => a.localeCompare(b))).toEqual([
      'i100',
      'i200',
    ]);

    const names = useSessionsStore
      .getState()
      .sessions.map((s) => s.name ?? '')
      .sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(['Gruppetto hin, zu zweit zurück', 'Karlsruhe Laufen']);
  });

  it('never downloads a Strava stub or an unsupported sport', async () => {
    const log = stubApi();

    const result = await runIntervalsImport({
      apiKey: 'secret-key',
      profile: profile(),
      window: WINDOW,
      knownActivityIds: [],
    });

    expect([...log.files].sort((a, b) => a.localeCompare(b))).toEqual(['i100', 'i200']);
    expect(log.files).not.toContain('i300');
    expect(log.files).not.toContain('i400');
    expect(result.unavailable).toBe(1);
    expect(result.unsupported).toBe(1);
  });

  it('writes records and the raw FIT keyed by the activity id', async () => {
    stubApi();

    const result = await runIntervalsImport({
      apiKey: 'secret-key',
      profile: profile(),
      window: WINDOW,
      knownActivityIds: [],
    });

    const sessionId =
      result.importedActivityIds.length > 0
        ? useSessionsStore.getState().sessions[0]?.id
        : undefined;
    expect(sessionId).toBeTruthy();
    expect((await getSessionRecords(sessionId ?? '')).length).toBeGreaterThan(0);

    const fit = await getFitFile(sessionId ?? '');
    expect(fit?.fileName).toMatch(/^i\d+\.fit$/);
  });

  it('imports nothing and downloads nothing on a second run', async () => {
    stubApi();
    const first = await runIntervalsImport({
      apiKey: 'secret-key',
      profile: profile(),
      window: WINDOW,
      knownActivityIds: [],
    });

    const log = stubApi();
    const second = await runIntervalsImport({
      apiKey: 'secret-key',
      profile: profile(),
      window: WINDOW,
      knownActivityIds: first.importedActivityIds,
    });

    expect(second.imported).toBe(0);
    expect(second.alreadyImported).toBe(2);
    expect(log.files).toEqual([]);
    expect(log.listings).toBe(1);
  });

  it('reports a hand-uploaded activity as a duplicate rather than importing it twice', async () => {
    stubApi();
    await runIntervalsImport({
      apiKey: 'secret-key',
      profile: profile(),
      window: WINDOW,
      knownActivityIds: [],
    });
    expect(useSessionsStore.getState().sessions).toHaveLength(2);

    stubApi();
    const second = await runIntervalsImport({
      apiKey: 'secret-key',
      profile: profile(),
      window: WINDOW,
      knownActivityIds: [],
    });

    expect(second.imported).toBe(0);
    expect(second.duplicated).toBe(2);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
  });

  it('reports progress once per activity', async () => {
    stubApi();
    const seen: Array<[number, number]> = [];

    await runIntervalsImport({
      apiKey: 'secret-key',
      profile: profile(),
      window: WINDOW,
      knownActivityIds: [],
      onProgress: (processed, total) => seen.push([processed, total]),
    });

    expect(seen[0]).toEqual([0, 2]);
    expect(seen.at(-1)).toEqual([2, 2]);
  });

  it('returns a fatal code and imports nothing when the key is rejected', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'nope' }), { status: 401 })),
    );

    const result = await runIntervalsImport({
      apiKey: 'bad-key',
      profile: profile(),
      window: WINDOW,
      knownActivityIds: [],
    });

    expect(result.fatal).toBe('unauthorized');
    expect(result.imported).toBe(0);
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });
});
