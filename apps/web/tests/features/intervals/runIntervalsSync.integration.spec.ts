import { describe, it, expect, vi, afterEach } from 'vite-plus/test';
import { readE2eFixture } from '@testUtils/fixtures.ts';
import { QueryClient } from '@tanstack/react-query';
import { runIntervalsSync } from '@/features/intervals/runIntervalsSync.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { createMockUserProfile } from '@tests/factories/profiles.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { MAX_ACTIVITIES_PER_IMPORT } from '@/lib/intervals.ts';
import { INGEST_BATCH_SIZE } from '@/features/sessions/createIngestBatcher.ts';

const LISTING = [
  { id: 'i100', name: 'Karlsruhe Laufen', type: 'Run', source: 'GARMIN_CONNECT', file_type: 'fit' },
  { id: 'i200', name: 'Z2', type: 'Ride', source: 'GARMIN_CONNECT', file_type: 'fit' },
];

const FILES: Record<string, string> = { i100: 'running.fit', i200: 'cycling.fit' };

const connect = () => {
  useUserStore.setState({ profile: createMockUserProfile() });
  useIntervalsStore.getState().connectIntervals('key');
};

const stubApi = (options?: { listStatus?: number; listing?: unknown[] }): string[] => {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      urls.push(url);

      if (url.includes('/activities')) {
        if (options?.listStatus !== undefined) {
          return new Response('{}', { status: options.listStatus });
        }
        return new Response(JSON.stringify(options?.listing ?? LISTING));
      }

      const id = /\/activity\/(\w+)\//.exec(url)?.[1] ?? '';
      const file = FILES[id];
      if (file === undefined) return new Response('{}', { status: 422 });
      return new Response(readE2eFixture(file));
    }),
  );
  return urls;
};

const listedOldest = (urls: string[]): string | null => {
  const listing = urls.find((u) => u.includes('/activities'));
  if (listing === undefined) return null;
  return new URL(listing).searchParams.get('oldest');
};

const seedIntervalsSession = (date: number) => {
  const { createdAt: _ca, ...data } = createMockTrainingSession({
    date,
    source: { kind: 'intervals', activityId: 'i1' },
  });
  useSessionsStore.getState().addSessions({ sessions: [data] });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe(runIntervalsSync.name, () => {
  it('imports pending activities and records their ids', async () => {
    connect();
    stubApi();

    const summary = await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });

    expect(summary.pending).toBe(2);
    expect(summary.imported).toBe(2);
    expect([...useIntervalsStore.getState().importedActivityIds].sort()).toEqual(['i100', 'i200']);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
  });

  it('records the ids of finished chunks before the import completes', async () => {
    connect();
    const listing = Array.from({ length: INGEST_BATCH_SIZE + 1 }, (_, i) => ({
      id: `i${i}`,
      type: 'Run',
      source: 'GARMIN_CONNECT',
      file_type: 'fit',
    }));
    const last = listing.at(-1)?.id;
    let recordedBeforeLast = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/activities')) return new Response(JSON.stringify(listing));
        if (url.includes(`/activity/${last}/`)) {
          recordedBeforeLast = useIntervalsStore.getState().importedActivityIds.length;
        }
        return new Response(readE2eFixture('minimal.fit'));
      }),
    );

    await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });

    expect(recordedBeforeLast).toBe(INGEST_BATCH_SIZE);
    expect(useIntervalsStore.getState().importedActivityIds).toHaveLength(INGEST_BATCH_SIZE + 1);
  });

  it('marks sessions imported by a background sync as new', async () => {
    connect();
    stubApi();

    await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });

    expect(useSessionsStore.getState().sessions.filter((s) => !(s.isNew === true))).toEqual([]);
  });

  it('marks sessions imported in the foreground as already seen', async () => {
    connect();
    stubApi();

    await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key', foreground: true });

    expect(useSessionsStore.getState().sessions).toHaveLength(2);
    expect(useSessionsStore.getState().sessions.filter((s) => !(s.isNew === false))).toEqual([]);
  });

  it('counts an activity whose download fails as failed', async () => {
    connect();
    stubApi({ listing: [...LISTING, { ...LISTING[0], id: 'i300' }] });

    const summary = await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });

    expect(summary.imported).toBe(2);
    expect(summary.failed).toBe(1);
  });

  it('separates an empty account from one that is merely up to date', async () => {
    connect();
    useIntervalsStore.getState().recordIntervalsImported(['i100', 'i200']);
    stubApi();

    const summary = await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });

    expect(summary.available).toBe(2);
    expect(summary.pending).toBe(0);
  });

  it('only downloads the activities that are not yet in the ledger', async () => {
    connect();
    useIntervalsStore.getState().recordIntervalsImported(['i100']);
    const urls = stubApi();

    const summary = await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });

    expect(summary.imported).toBe(1);
    expect(urls).not.toContainEqual(expect.stringContaining('/activity/i100/'));
    expect(urls).toContainEqual(expect.stringContaining('/activity/i200/'));
  });

  it('flags the key invalid and throws when the listing returns 401', async () => {
    connect();
    stubApi({ listStatus: 401 });

    await expect(
      runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' }),
    ).rejects.toMatchObject({
      reason: 'unauthorized',
    });
    expect(useIntervalsStore.getState().keyInvalid).toBe(true);
  });

  it('tags imported sessions with their intervals.icu activity', async () => {
    connect();
    stubApi();

    await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });

    const sources = useSessionsStore.getState().sessions.map((s) => s.source);
    expect(sources).toEqual(
      expect.arrayContaining([
        { kind: 'intervals', activityId: 'i100' },
        { kind: 'intervals', activityId: 'i200' },
      ]),
    );
  });

  it('lists the full history while no intervals.icu session exists', async () => {
    connect();
    const urls = stubApi();

    await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });

    expect(listedOldest(urls)).toBe('1990-01-01');
  });

  it('lists from 14 days before the newest intervals.icu session', async () => {
    connect();
    seedIntervalsSession(new Date(2026, 8, 20, 10).getTime());
    const { createdAt: _ca, ...file } = createMockTrainingSession({
      date: new Date(2026, 9, 30, 10).getTime(),
      source: { kind: 'file' },
    });
    useSessionsStore.getState().addSessions({ sessions: [file] });
    const urls = stubApi();

    await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });

    expect(listedOldest(urls)).toBe('2026-09-06');
  });

  it('lists the full history when asked to, despite a window', async () => {
    connect();
    seedIntervalsSession(new Date(2026, 8, 20, 10).getTime());
    const urls = stubApi();

    await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key', full: true });

    expect(listedOldest(urls)).toBe('1990-01-01');
  });

  it('flags a backlog when the batch hits the cap, and lists in full next time', async () => {
    connect();
    const listing = Array.from({ length: MAX_ACTIVITIES_PER_IMPORT + 1 }, (_, i) => ({
      ...LISTING[0],
      id: `x${i}`,
    }));
    stubApi({ listing });

    await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });
    expect(useIntervalsStore.getState().backlogPending).toBe(true);

    seedIntervalsSession(new Date(2026, 8, 20, 10).getTime());
    const urls = stubApi();
    await runIntervalsSync({ queryClient: new QueryClient(), apiKey: 'key' });

    expect(listedOldest(urls)).toBe('1990-01-01');
  });
});
