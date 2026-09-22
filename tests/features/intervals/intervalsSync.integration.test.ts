import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runIntervalsSync } from '@/features/intervals/runIntervalsSync.ts';
import { useIntervalsStore } from '@/store/intervals.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { makeUserProfile } from '@tests/factories/profiles.ts';
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

const stubApi = (options?: { listStatus?: number; activityStatus?: number }): string[] => {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      urls.push(url);

      if (url.includes('/activities')) {
        if (options?.listStatus !== undefined) {
          return new Response('{}', { status: options.listStatus });
        }
        return new Response(JSON.stringify(LISTING));
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

  it('resets progress once a sync finishes', async () => {
    connect();
    stubApi();

    await runIntervalsSync();

    const { useIntervalsProgressStore } = await import('@/features/intervals/syncProgress.ts');
    expect(useIntervalsProgressStore.getState().total).toBe(0);
    expect(useIntervalsProgressStore.getState().processed).toBe(0);
  });
});
