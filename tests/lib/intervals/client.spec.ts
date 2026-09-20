import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  INTERVALS_BASE_URL,
  buildIntervalsAuthHeader,
  intervalsFetchBytes,
  intervalsFetchJson,
} from '@/lib/intervals/client.ts';

const KEY = 'super-secret-key';

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status });

afterEach(() => {
  vi.unstubAllGlobals();
});

const stubFetch = (impl: typeof fetch): ReturnType<typeof vi.fn> => {
  const spy = vi.fn(impl);
  vi.stubGlobal('fetch', spy);
  return spy;
};

describe('buildIntervalsAuthHeader', () => {
  it('uses the literal string API_KEY as the username', () => {
    expect(buildIntervalsAuthHeader(KEY)).toBe(`Basic ${btoa(`API_KEY:${KEY}`)}`);
    expect(atob(buildIntervalsAuthHeader(KEY).slice(6))).toBe(`API_KEY:${KEY}`);
  });
});

describe('intervalsFetchJson', () => {
  it('sends the key only in the Authorization header and omits credentials', async () => {
    const spy = stubFetch(async () => jsonResponse({ firstname: 'Fabian' }));

    await intervalsFetchJson(KEY, '/athlete/0', { oldest: '2026-01-01' });

    const url = String(spy.mock.calls[0]?.[0]);
    const init = spy.mock.calls[0]?.[1] as RequestInit;

    expect(url).toBe(`${INTERVALS_BASE_URL}/athlete/0?oldest=2026-01-01`);
    expect(url).not.toContain(KEY);
    expect(init.credentials).toBe('omit');
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      buildIntervalsAuthHeader(KEY),
    );
  });

  it('returns the parsed body on success', async () => {
    stubFetch(async () => jsonResponse([{ id: 'i1' }]));
    const result = await intervalsFetchJson(KEY, '/athlete/0/activities');
    expect(result).toEqual({ ok: true, data: [{ id: 'i1' }] });
  });

  it.each([
    [401, 'unauthorized'],
    [403, 'unauthorized'],
    [404, 'not-found'],
    [422, 'unavailable'],
  ])('maps %i to %s without retrying', async (status, code) => {
    const spy = stubFetch(async () => jsonResponse({ error: 'nope' }, status));
    const result = await intervalsFetchJson(KEY, '/athlete/0');
    expect(result).toEqual({ ok: false, code });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('retries a server error and gives up after three attempts', async () => {
    const spy = stubFetch(async () => jsonResponse({}, 503));
    const result = await intervalsFetchJson(KEY, '/athlete/0');
    expect(result).toEqual({ ok: false, code: 'server' });
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('recovers when a retry succeeds', async () => {
    let calls = 0;
    stubFetch(async () => {
      calls++;
      if (calls === 1) return jsonResponse({}, 429);
      return jsonResponse({ firstname: 'Fabian' });
    });

    const result = await intervalsFetchJson(KEY, '/athlete/0');
    expect(result).toEqual({ ok: true, data: { firstname: 'Fabian' } });
  });

  it('reports offline rather than a network failure when the browser knows it is offline', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    expect(await intervalsFetchJson(KEY, '/athlete/0')).toEqual({ ok: false, code: 'offline' });
    vi.restoreAllMocks();
  });

  it('reports a network failure when online, which is also the CORS case', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(await intervalsFetchJson(KEY, '/athlete/0')).toEqual({ ok: false, code: 'network' });
  });

  it('reports malformed rather than throwing on an unparseable body', async () => {
    stubFetch(async () => new Response('<html>not json</html>', { status: 200 }));
    expect(await intervalsFetchJson(KEY, '/athlete/0')).toEqual({ ok: false, code: 'malformed' });
  });

  it('never leaks the key into a failed result', async () => {
    stubFetch(async () => jsonResponse({ error: 'nope' }, 401));
    const result = await intervalsFetchJson(KEY, '/athlete/0');
    expect(JSON.stringify(result)).not.toContain(KEY);
  });

  it('reports an aborted request distinctly from a network failure', async () => {
    const controller = new AbortController();
    stubFetch(async () => {
      throw new DOMException('aborted', 'AbortError');
    });
    controller.abort();

    expect(await intervalsFetchJson(KEY, '/athlete/0', undefined, controller.signal)).toEqual({
      ok: false,
      code: 'aborted',
    });
  });
});

describe('intervalsFetchBytes', () => {
  it('returns raw bytes and sends no Accept header', async () => {
    const body = new Uint8Array([1, 2, 3, 4]);
    const spy = stubFetch(async () => new Response(body, { status: 200 }));

    const result = await intervalsFetchBytes(KEY, '/activity/i1/file');

    expect(result.ok).toBe(true);
    if (result.ok) expect(new Uint8Array(result.data)).toEqual(body);

    const init = spy.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).Accept).toBeUndefined();
    expect(init.credentials).toBe('omit');
  });

  it('maps the Strava refusal to unavailable', async () => {
    stubFetch(async () =>
      jsonResponse({ error: 'Cannot read Strava activities via the API' }, 422),
    );
    expect(await intervalsFetchBytes(KEY, '/activity/i1/file')).toEqual({
      ok: false,
      code: 'unavailable',
    });
  });
});

describe('client hardening', () => {
  it('never throws on a key that btoa cannot encode, and reads as a rejected key', async () => {
    const spy = stubFetch(async () => jsonResponse({ ok: true }));

    const result = await intervalsFetchJson('key-with-nbsp —', '/athlete/0');

    expect(result).toEqual({ ok: false, code: 'unauthorized' });
    expect(spy).not.toHaveBeenCalled();
  });

  it('does not retry a deterministic 400', async () => {
    const spy = stubFetch(async () => jsonResponse({ error: 'bad request' }, 400));

    const result = await intervalsFetchJson(KEY, '/athlete/0');

    expect(result).toEqual({ ok: false, code: 'client' });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('still retries a 500', async () => {
    const spy = stubFetch(async () => jsonResponse({}, 500));
    await intervalsFetchJson(KEY, '/athlete/0');
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('abandons the backoff wait as soon as the signal aborts', async () => {
    const controller = new AbortController();
    stubFetch(async () => jsonResponse({}, 503));

    const started = Date.now();
    const pending = intervalsFetchJson(KEY, '/athlete/0', undefined, controller.signal);
    setTimeout(() => controller.abort(), 20);
    const result = await pending;

    expect(Date.now() - started).toBeLessThan(400);
    expect(result.ok).toBe(false);
  });
});
