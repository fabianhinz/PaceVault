import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runIntervalsSync } from '@/features/intervals/runIntervalsSync.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import { MAX_ACTIVITIES_PER_IMPORT } from '@/lib/intervals.ts';
import { useIntervalsProgressStore } from '@/features/intervals/syncProgress.ts';

const LISTING = [
  { id: 'i100', name: 'Karlsruhe Laufen', type: 'Run', source: 'GARMIN_CONNECT', file_type: 'fit' },
  { id: 'i200', name: 'Z2', type: 'Ride', source: 'GARMIN_CONNECT', file_type: 'fit' },
];

const FILES: Record<string, string> = { i100: 'running.fit', i200: 'cycling.fit' };

const fixture = (name: string): ArrayBuffer => {
  const buf = readFileSync(resolve(`e2e/fixtures/${name}`));
  const bytes = new Uint8Array(buf.byteLength);
  bytes.set(buf);
  return bytes.buffer;
};

const connect = () => {
  useUserStore.setState({ profile: makeUserProfile() });
  useIntervalsStore.getState().connectIntervals('key', 'Fabian');
};

const stubApi = (options?: {
  listStatus?: number;
  activityStatus?: number;
  listing?: unknown[];
}): string[] => {
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

      if (options?.activityStatus !== undefined) {
        return new Response('{}', { status: options.activityStatus });
      }

      const id = /\/activity\/(\w+)\//.exec(url)?.[1] ?? '';
      const file = FILES[id];
      if (file === undefined) return new Response('{}', { status: 422 });
      return new Response(fixture(file));
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
  const {
    id: _id,
    createdAt: _ca,
    ...data
  } = makeSession({
    date,
    source: { kind: 'intervals', activityId: 'i1' },
  });
  useSessionsStore.getState().addSession(data);
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runIntervalsSync', () => {
  it('does nothing when no key is connected', async () => {
    const urls = stubApi();

    const summary = await runIntervalsSync();

    expect(summary).toEqual({ available: 0, pending: 0, imported: 0, duplicated: 0 });
    expect(urls).toHaveLength(0);
  });

  it('imports pending activities and records their ids', async () => {
    connect();
    stubApi();

    const summary = await runIntervalsSync();

    expect(summary.pending).toBe(2);
    expect(summary.imported).toBe(2);
    expect([...useIntervalsStore.getState().importedActivityIds].sort()).toEqual(['i100', 'i200']);
    expect(useSessionsStore.getState().sessions).toHaveLength(2);
  });

  it('marks sessions imported by a background sync as new', async () => {
    connect();
    stubApi();

    await runIntervalsSync();

    expect(useSessionsStore.getState().sessions.every((s) => s.isNew === true)).toBe(true);
  });

  it('marks sessions imported in the foreground as already seen', async () => {
    connect();
    stubApi();
    useIntervalsProgressStore.getState().setIntervalsSyncForeground(true);

    await runIntervalsSync();

    expect(useSessionsStore.getState().sessions).toHaveLength(2);
    expect(useSessionsStore.getState().sessions.every((s) => s.isNew === false)).toBe(true);
  });

  it('separates an empty account from one that is merely up to date', async () => {
    connect();
    useIntervalsStore.getState().recordIntervalsImported(['i100', 'i200']);
    stubApi();

    const summary = await runIntervalsSync();

    expect(summary.available).toBe(2);
    expect(summary.pending).toBe(0);
  });

  it('skips activities already in the ledger and downloads nothing', async () => {
    connect();
    useIntervalsStore.getState().recordIntervalsImported(['i100', 'i200']);
    const urls = stubApi();

    const summary = await runIntervalsSync();

    expect(summary).toEqual({ available: 2, pending: 0, imported: 0, duplicated: 0 });
    expect(urls.filter((u) => u.includes('/activity/'))).toHaveLength(0);
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('only downloads the activities that are not yet in the ledger', async () => {
    connect();
    useIntervalsStore.getState().recordIntervalsImported(['i100']);
    const urls = stubApi();

    const summary = await runIntervalsSync();

    expect(summary.imported).toBe(1);
    expect(urls.some((u) => u.includes('/activity/i100/'))).toBe(false);
    expect(urls.some((u) => u.includes('/activity/i200/'))).toBe(true);
  });

  it('downloads pending activities newest first, with undated ones last', async () => {
    connect();
    const urls = stubApi({
      listing: [
        { ...LISTING[0], id: 'i1', start_date_local: '2024-01-05T07:00:00' },
        { ...LISTING[0], id: 'i2', start_date_local: null },
        { ...LISTING[0], id: 'i3', start_date_local: '2025-06-01T18:30:00' },
        { ...LISTING[0], id: 'i4', start_date_local: '2024-11-20T06:15:00' },
      ],
    });

    await runIntervalsSync();

    const order = [...new Set(urls.flatMap((u) => /\/activity\/(\w+)\//.exec(u)?.[1] ?? []))];
    expect(order).toEqual(['i3', 'i4', 'i1', 'i2']);
  });

  it('flags the key invalid and throws when the listing returns 401', async () => {
    connect();
    stubApi({ listStatus: 401 });

    await expect(runIntervalsSync()).rejects.toThrow('unauthorized');
    expect(useIntervalsStore.getState().keyInvalid).toBe(true);
  });

  it('throws without flagging the key when the listing is rate limited', async () => {
    connect();
    stubApi({ listStatus: 429 });

    await expect(runIntervalsSync()).rejects.toThrow('rate-limited');
    expect(useIntervalsStore.getState().keyInvalid).toBe(false);
  });

  it('flags the key invalid without throwing when a download returns 401', async () => {
    connect();
    stubApi({ activityStatus: 401 });

    const summary = await runIntervalsSync();

    expect(summary).toEqual({ available: 2, pending: 2, imported: 0, duplicated: 0 });
    expect(useIntervalsStore.getState().keyInvalid).toBe(true);
  });

  it('reports nothing pending when no activity is of a supported type', async () => {
    connect();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify([
              {
                id: 'i900',
                name: 'Swim',
                type: 'Swim',
                source: 'GARMIN_CONNECT',
                file_type: 'fit',
              },
              { id: 'i901', name: 'Ride', type: 'Ride', source: 'STRAVA', file_type: 'fit' },
            ]),
          ),
      ),
    );

    const summary = await runIntervalsSync();

    expect(summary.available).toBe(0);
    expect(summary.pending).toBe(0);
    expect(useSessionsStore.getState().sessions).toHaveLength(0);
  });

  it('tags imported sessions with their intervals.icu activity', async () => {
    connect();
    stubApi();

    await runIntervalsSync();

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

    await runIntervalsSync();

    expect(listedOldest(urls)).toBe('1990-01-01');
  });

  it('lists from 14 days before the newest intervals.icu session', async () => {
    connect();
    seedIntervalsSession(new Date(2026, 8, 20, 10).getTime());
    const {
      id: _id,
      createdAt: _ca,
      ...file
    } = makeSession({
      date: new Date(2026, 9, 30, 10).getTime(),
      source: { kind: 'file' },
    });
    useSessionsStore.getState().addSession(file);
    const urls = stubApi();

    await runIntervalsSync();

    expect(listedOldest(urls)).toBe('2026-09-06');
  });

  it('lists the full history when asked to, despite a window', async () => {
    connect();
    seedIntervalsSession(new Date(2026, 8, 20, 10).getTime());
    const urls = stubApi();

    await runIntervalsSync({ full: true });

    expect(listedOldest(urls)).toBe('1990-01-01');
  });

  it('flags a backlog when the batch hits the cap, and lists in full next time', async () => {
    connect();
    const listing = Array.from({ length: MAX_ACTIVITIES_PER_IMPORT + 1 }, (_, i) => ({
      ...LISTING[0],
      id: `x${i}`,
    }));
    stubApi({ listing });

    await runIntervalsSync();
    expect(useIntervalsStore.getState().backlogPending).toBe(true);

    seedIntervalsSession(new Date(2026, 8, 20, 10).getTime());
    const urls = stubApi();
    await runIntervalsSync();

    expect(listedOldest(urls)).toBe('1990-01-01');
  });

  it('flags a backlog when a download is cut off', async () => {
    connect();
    stubApi({ activityStatus: 429 });

    await runIntervalsSync();

    expect(useIntervalsStore.getState().backlogPending).toBe(true);
  });

  it('clears the backlog after a complete full listing', async () => {
    connect();
    useIntervalsStore.getState().setIntervalsBacklogPending(true);
    stubApi();

    await runIntervalsSync();

    expect(useIntervalsStore.getState().backlogPending).toBe(false);
  });

  it('resets progress once a sync finishes', async () => {
    connect();
    stubApi();

    await runIntervalsSync();

    const { useIntervalsProgressStore } = await import('@/features/intervals/syncProgress.ts');
    expect(useIntervalsProgressStore.getState().total).toBe(0);
    expect(useIntervalsProgressStore.getState().processed).toBe(0);
  });
});
