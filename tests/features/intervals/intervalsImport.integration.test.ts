import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runIntervalsImport } from '@/features/intervals/runIntervalsImport.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { getSessionRecords, getFitFile } from '@/lib/indexeddb.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';
import type { IntervalsActivity } from '@/lib/intervals.ts';

const fixture = (name: string): ArrayBuffer => {
  const buf = readFileSync(resolve(`e2e/fixtures/${name}`));
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(buf);
  return bytes.buffer;
};

const ACTIVITIES: IntervalsActivity[] = [
  { id: 'i100', name: 'Karlsruhe Laufen', type: 'Run', source: 'GARMIN_CONNECT', file_type: 'fit' },
  { id: 'i200', name: 'Z2', type: 'Ride', source: 'GARMIN_CONNECT', file_type: 'fit' },
];

const FILES: Record<string, string> = { i100: 'running.fit', i200: 'cycling.fit' };

const stubApi = (): string[] => {
  const requested: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const id = /\/activity\/(\w+)\//.exec(url)?.[1] ?? '';
      requested.push(id);
      const file = FILES[id];
      if (file === undefined) return new Response('{}', { status: 422 });
      return new Response(fixture(file));
    }),
  );
  return requested;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runIntervalsImport', () => {
  it('imports activities and names them from the listing, not the filename', async () => {
    stubApi();
    const seen: number[] = [];

    const result = await runIntervalsImport('key', makeUserProfile(), ACTIVITIES, (p) =>
      seen.push(p),
    );

    expect(result.imported).toBe(2);
    expect(result.fatal).toBeUndefined();
    expect(result.importedActivityIds).toEqual(['i100', 'i200']);
    expect(seen).toEqual([1, 2]);

    const names = useSessionsStore
      .getState()
      .sessions.map((s) => s.name ?? '')
      .sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(['Karlsruhe Laufen', 'Z2']);
  });

  it('stores records and the raw FIT keyed by the activity id', async () => {
    stubApi();
    await runIntervalsImport('key', makeUserProfile(), ACTIVITIES, () => {});

    const sessionId = useSessionsStore.getState().sessions[0]?.id ?? '';
    expect((await getSessionRecords(sessionId)).length).toBeGreaterThan(0);
    expect((await getFitFile(sessionId))?.fileName).toMatch(/^i\d+\.fit$/);
  });

  it('reports an already-owned activity as a duplicate rather than importing it twice', async () => {
    stubApi();
    await runIntervalsImport('key', makeUserProfile(), ACTIVITIES, () => {});

    stubApi();
    const second = await runIntervalsImport('key', makeUserProfile(), ACTIVITIES, () => {});

    expect(second.imported).toBe(0);
    expect(second.duplicated).toBe(2);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
  });

  it('stops immediately when rate limited and keeps what already landed', async () => {
    let calls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        calls++;
        if (calls > 1) return new Response('{}', { status: 429 });
        const id = /\/activity\/(\w+)\//.exec(url)?.[1] ?? '';
        return new Response(fixture(FILES[id] ?? 'running.fit'));
      }),
    );

    const result = await runIntervalsImport('key', makeUserProfile(), ACTIVITIES, () => {});

    expect(result.fatal).toBe('rate-limited');
    expect(result.imported).toBe(1);
    expect(result.importedActivityIds).toEqual(['i100']);
  });

  it('skips an activity whose file will not parse and keeps going', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const id = /\/activity\/(\w+)\//.exec(url)?.[1] ?? '';
        if (id === 'i100') return new Response(new Uint8Array([0, 1, 2, 3]));
        return new Response(fixture('cycling.fit'));
      }),
    );

    const result = await runIntervalsImport('key', makeUserProfile(), ACTIVITIES, () => {});

    expect(result.imported).toBe(1);
    expect(result.importedActivityIds).toEqual(['i200']);
  });
});
