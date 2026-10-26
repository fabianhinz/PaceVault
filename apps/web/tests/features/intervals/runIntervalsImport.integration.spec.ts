import { describe, it, expect, vi, afterEach } from 'vite-plus/test';
import { readE2eFixture } from '@testUtils/fixtures.ts';
import { QueryClient } from '@tanstack/react-query';
import { runIntervalsImport } from '@/features/intervals/runIntervalsImport.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';
import type { IntervalsActivity } from '@/lib/intervals.ts';

const ACTIVITIES: IntervalsActivity[] = [
  { id: 'i100', name: 'Karlsruhe Laufen', type: 'Run', source: 'GARMIN_CONNECT', file_type: 'fit' },
  { id: 'i200', name: 'Z2', type: 'Ride', source: 'GARMIN_CONNECT', file_type: 'fit' },
];

const FILES: Record<string, string> = { i100: 'running.fit', i200: 'cycling.fit' };

const stubApi = () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const id = /\/activity\/(\w+)\//.exec(url)?.[1] ?? '';
      const file = FILES[id];
      if (file === undefined) return new Response('{}', { status: 422 });
      return new Response(readE2eFixture(file));
    }),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(runIntervalsImport.name, () => {
  it('imports activities and names them from the listing, not the filename', async () => {
    stubApi();
    const seen: number[] = [];
    const ingestedIds: string[] = [];

    const result = await runIntervalsImport({
      apiKey: 'key',
      profile: createMockUserProfile(),
      activities: ACTIVITIES,
      onProgress: (p) => seen.push(p),
      queryClient: new QueryClient(),
      onChunkIngested: (ids) => ingestedIds.push(...ids),
    });

    expect(result.imported).toBe(2);
    expect(result.fatal).toBeUndefined();
    expect(ingestedIds).toEqual(['i100', 'i200']);
    expect(seen).toEqual([1, 2]);

    const names = useSessionsStore
      .getState()
      .sessions.map((s) => s.name ?? '')
      .sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(['Karlsruhe Laufen', 'Z2']);
  });

  it('skips an activity whose file will not parse and keeps going', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const id = /\/activity\/(\w+)\//.exec(url)?.[1] ?? '';
        if (id === 'i100') return new Response(new Uint8Array([0, 1, 2, 3]));
        return new Response(readE2eFixture('cycling.fit'));
      }),
    );

    const ingestedIds: string[] = [];
    const result = await runIntervalsImport({
      apiKey: 'key',
      profile: createMockUserProfile(),
      activities: ACTIVITIES,
      onProgress: () => {},
      queryClient: new QueryClient(),
      onChunkIngested: (ids) => ingestedIds.push(...ids),
    });

    expect(result.imported).toBe(1);
    expect(ingestedIds).toEqual(['i200']);
  });

  it('stops at the first rate-limited download and reports it as fatal', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 429 })),
    );

    const seen: number[] = [];
    const result = await runIntervalsImport({
      apiKey: 'key',
      profile: createMockUserProfile(),
      activities: ACTIVITIES,
      onProgress: (p) => seen.push(p),
      queryClient: new QueryClient(),
      onChunkIngested: () => {},
    });

    expect(result.fatal).toBe('rate-limited');
    expect(result.failed).toBe(0);
    expect(seen).toEqual([]);
  });
});
