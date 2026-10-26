import { describe, it, expect, vi, afterEach } from 'vite-plus/test';
import { FailedResponseError } from '@/lib/fetchResponse.ts';
import {
  downloadActivityFit,
  intervalsErrorCode,
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
  const listed = await listIntervalsActivities({ apiKey: KEY });
  return listed.map((a) => a.id);
};

describe('listIntervalsActivities filtering', () => {
  it('returns every ride and run variant intervals.icu emits', async () => {
    const types = [
      'Ride',
      'VirtualRide',
      'GravelRide',
      'MountainBikeRide',
      'EBikeRide',
      'EMountainBikeRide',
      'TrackRide',
      'Cyclocross',
      'Handcycle',
      'Velomobile',
      'Run',
      'TrailRun',
      'VirtualRun',
    ];
    const ids = await listWith(types.map((type, i) => ({ id: `i${i}`, type })));
    expect(ids).toHaveLength(types.length);
  });

  it('keeps activities without a type, so the FIT parser decides', async () => {
    const ids = await listWith([{ id: 'untyped', type: null }]);
    expect(ids).toEqual(['untyped']);
  });

  it('drops every other type, so it is never downloaded', async () => {
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
});

describe(verifyIntervalsKey.name, () => {
  it('sends basic auth with the literal username API_KEY and omits credentials', async () => {
    const spy = stubFetch(async () => Response.json({ firstname: 'Fabian' }));

    await expect(verifyIntervalsKey(KEY)).resolves.toBeUndefined();

    const url = spy.mock.calls[0]?.[0] ?? '';
    const init = spy.mock.calls[0]?.[1] ?? {};
    expect(url).toBe('https://intervals.icu/api/v1/athlete/0');
    expect(url).not.toContain(KEY);
    expect(init.credentials).toBe('omit');
    expect(new Headers(init.headers).get('Authorization')).toBe(`Basic ${btoa(`API_KEY:${KEY}`)}`);
  });

  it('rejects with the failed response when the key is refused', async () => {
    stubFetch(async () => new Response('{}', { status: 401 }));

    await expect(verifyIntervalsKey(KEY)).rejects.toMatchObject({
      name: 'FailedResponseError',
      reason: 'unauthorized',
    });
  });
});

describe(listIntervalsActivities.name, () => {
  it('drops malformed rows without voiding the listing', async () => {
    stubFetch(async () => Response.json([{ id: 'i1' }, { name: 'no id' }, { id: 'i2' }]));

    expect((await listIntervalsActivities({ apiKey: KEY })).map((a) => a.id)).toEqual(['i1', 'i2']);
  });
});

describe(downloadActivityFit.name, () => {
  it('prefers the device original for FIT uploads, because it carries the file_id', async () => {
    const spy = stubFetch(async () => new Response(new Uint8Array([1, 2])));

    await downloadActivityFit({ apiKey: KEY, activity: activity({ id: 'i1', file_type: 'fit' }) });

    expect(spy.mock.calls[0]?.[0] ?? '').toContain('/activity/i1/file');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('falls back to the generated file when the original is unavailable', async () => {
    const spy = stubFetch(async (url) => {
      if (url.endsWith('/file')) return new Response('{}', { status: 422 });
      return new Response(new Uint8Array([1, 2]));
    });

    await expect(
      downloadActivityFit({ apiKey: KEY, activity: activity({ id: 'i1', file_type: 'fit' }) }),
    ).resolves.toBeInstanceOf(ArrayBuffer);
    expect(spy.mock.calls[1]?.[0] ?? '').toContain('/activity/i1/fit-file');
  });

  it('does not fall back to the generated file when the original is rate-limited', async () => {
    const spy = stubFetch(async () => new Response('{}', { status: 429 }));

    await expect(
      downloadActivityFit({ apiKey: KEY, activity: activity({ id: 'i1', file_type: 'fit' }) }),
    ).rejects.toMatchObject({ name: 'FailedResponseError', reason: 'rate-limited' });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe(intervalsErrorCode.name, () => {
  it('reads the code from the failed response type, not from the message', () => {
    const error = new FailedResponseError({
      operation: 'intervals.icu GET /athlete/0',
      response: new Response('{}', { status: 429 }),
    });

    expect(error).toMatchObject({ name: 'FailedResponseError', reason: 'rate-limited' });
    expect(intervalsErrorCode(error)).toBe('rate-limited');
  });

  it('maps a fetch TypeError to network and any other error to failed', () => {
    expect(intervalsErrorCode(new TypeError('Failed to fetch'))).toBe('network');
    expect(intervalsErrorCode(new Error('rate-limited'))).toBe('failed');
  });
});
