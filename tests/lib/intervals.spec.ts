import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  MAX_ACTIVITIES_PER_IMPORT,
  downloadActivityFit,
  listIntervalsActivities,
  verifyIntervalsKey,
  type IntervalsActivity,
} from '@/lib/intervals.ts';

const KEY = 'secret-key';

const activity = (over: Partial<IntervalsActivity> & { id: string }): IntervalsActivity => ({
  name: 'Ride',
  type: 'Ride',
  source: 'GARMIN_CONNECT',
  file_type: 'fit',
  ...over,
});

const stubFetch = (impl: (url: string, init?: RequestInit) => Promise<Response>) => {
  const spy = vi.fn(impl);
  vi.stubGlobal('fetch', spy);
  return spy;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const listWith = async (activities: Array<Partial<IntervalsActivity> & { id: string }>) => {
  stubFetch(async () => Response.json(activities.map((a) => activity(a))));
  const result = await listIntervalsActivities(KEY);
  if (!result.ok) throw new Error('expected a successful listing');
  return result.data.map((a) => a.id);
};

describe('listIntervalsActivities filtering', () => {
  it('returns every ride and run variant intervals.icu emits', async () => {
    const types = [
      'Ride',
      'VirtualRide',
      'GravelRide',
      'MountainBikeRide',
      'EMountainBikeRide',
      'TrackRide',
      'Run',
      'TrailRun',
      'VirtualRun',
      'Cyclocross',
    ];
    const ids = await listWith(types.map((type, i) => ({ id: `i${i}`, type })));
    expect(ids).toHaveLength(types.length);
  });

  it('drops sports PaceVault cannot parse, so they are never downloaded', async () => {
    const ids = await listWith([
      { id: 'keep', type: 'Run' },
      { id: 'swim', type: 'Swim' },
      { id: 'walk', type: 'Walk' },
      { id: 'gym', type: 'WeightTraining' },
      { id: 'row', type: 'VirtualRow' },
    ]);
    expect(ids).toEqual(['keep']);
  });

  it('drops Strava activities, which the API refuses to share', async () => {
    const ids = await listWith([
      { id: 'keep', source: 'GARMIN_CONNECT' },
      { id: 'strava', source: 'STRAVA' },
    ]);
    expect(ids).toEqual(['keep']);
  });

  it('keeps an activity with no type rather than dropping it', async () => {
    expect(await listWith([{ id: 'i1', type: null }])).toEqual(['i1']);
  });
});

describe('verifyIntervalsKey', () => {
  it('sends basic auth with the literal username API_KEY and omits credentials', async () => {
    const spy = stubFetch(async () => Response.json({ firstname: 'Fabian' }));

    const result = await verifyIntervalsKey(KEY);

    expect(result).toEqual({ ok: true, data: { firstname: 'Fabian' } });

    const url = spy.mock.calls[0]?.[0] ?? '';
    const init = spy.mock.calls[0]?.[1] ?? {};
    expect(url).toBe('https://intervals.icu/api/v1/athlete/0');
    expect(url).not.toContain(KEY);
    expect(init.credentials).toBe('omit');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${btoa(`API_KEY:${KEY}`)}`,
    );
  });

  it('keeps nothing but the first name, so the key and e-mail in the payload are dropped', async () => {
    stubFetch(async () =>
      Response.json({ firstname: 'Fabian', icu_api_key: KEY, email: 'a@b.com', weight: 76 }),
    );

    const result = await verifyIntervalsKey(KEY);

    expect(result).toEqual({ ok: true, data: { firstname: 'Fabian' } });
    expect(JSON.stringify(result)).not.toContain(KEY);
    expect(JSON.stringify(result)).not.toContain('a@b.com');
  });

  it.each([
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [429, 'rate-limited'],
    [500, 'failed'],
  ])('maps %i to %s', async (status, code) => {
    stubFetch(async () => new Response('{}', { status }));
    expect(await verifyIntervalsKey(KEY)).toEqual({ ok: false, code });
  });

  it('never throws when the network fails', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(await verifyIntervalsKey(KEY)).toEqual({ ok: false, code: 'network' });
  });
});

describe('listIntervalsActivities', () => {
  it('requests only the fields the schema declares', async () => {
    const spy = stubFetch(async () => Response.json([]));

    await listIntervalsActivities(KEY);

    const url = new URL(spy.mock.calls[0]?.[0] ?? '');
    expect(url.searchParams.get('fields')).toBe('id,name,type,source,file_type');
    expect(url.searchParams.get('oldest')).toBe('1990-01-01');
  });

  it('drops malformed rows without voiding the listing', async () => {
    stubFetch(async () => Response.json([{ id: 'i1' }, { name: 'no id' }, { id: 'i2' }]));

    const result = await listIntervalsActivities(KEY);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.map((a) => a.id)).toEqual(['i1', 'i2']);
  });

  it('returns an empty list rather than throwing on a non-array payload', async () => {
    stubFetch(async () => Response.json({ error: 'nope' }));
    expect(await listIntervalsActivities(KEY)).toEqual({ ok: true, data: [] });
  });
});

describe('downloadActivityFit', () => {
  it('prefers the device original for FIT uploads, because it carries the file_id', async () => {
    const spy = stubFetch(async () => new Response(new Uint8Array([1, 2])));

    await downloadActivityFit(KEY, activity({ id: 'i1', file_type: 'fit' }));

    expect(spy.mock.calls[0]?.[0] ?? '').toContain('/activity/i1/file');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('falls back to the generated file when the original is unavailable', async () => {
    const spy = stubFetch(async (url) => {
      if (url.endsWith('/file')) return new Response('{}', { status: 422 });
      return new Response(new Uint8Array([1, 2]));
    });

    const result = await downloadActivityFit(KEY, activity({ id: 'i1', file_type: 'fit' }));

    expect(result.ok).toBe(true);
    expect(spy.mock.calls[1]?.[0] ?? '').toContain('/activity/i1/fit-file');
  });

  it('goes straight to the generated file for non-FIT sources', async () => {
    const spy = stubFetch(async () => new Response(new Uint8Array([1, 2])));

    await downloadActivityFit(KEY, activity({ id: 'i1', file_type: 'tcx' }));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0] ?? '').toContain('/fit-file');
  });

  it('gives up immediately when rate limited rather than trying the other endpoint', async () => {
    const spy = stubFetch(async () => new Response('{}', { status: 429 }));

    const result = await downloadActivityFit(KEY, activity({ id: 'i1', file_type: 'fit' }));

    expect(result).toEqual({ ok: false, code: 'rate-limited' });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('MAX_ACTIVITIES_PER_IMPORT', () => {
  it('stays under the documented 2500 requests per rolling 15 minutes', () => {
    expect(MAX_ACTIVITIES_PER_IMPORT).toBeLessThan(2500);
  });
});
