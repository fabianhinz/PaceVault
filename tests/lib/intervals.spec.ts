import { describe, it, expect, vi, afterEach } from 'vitest';
import {
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

describe('verifyIntervalsKey', () => {
  it('sends basic auth with the literal username API_KEY and omits credentials', async () => {
    const spy = stubFetch(async () => Response.json({ firstname: 'Fabian' }));

    const result = await verifyIntervalsKey(KEY);

    expect(result).toEqual({ ok: true, data: true });

    const url = spy.mock.calls[0]?.[0] ?? '';
    const init = spy.mock.calls[0]?.[1] ?? {};
    expect(url).toBe('https://intervals.icu/api/v1/athlete/0');
    expect(url).not.toContain(KEY);
    expect(init.credentials).toBe('omit');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${btoa(`API_KEY:${KEY}`)}`,
    );
  });
});

describe('listIntervalsActivities', () => {
  it('drops malformed rows without voiding the listing', async () => {
    stubFetch(async () => Response.json([{ id: 'i1' }, { name: 'no id' }, { id: 'i2' }]));

    const result = await listIntervalsActivities(KEY);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.map((a) => a.id)).toEqual(['i1', 'i2']);
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
});
