export type IntervalsErrorCode =
  | 'unauthorized'
  | 'not-found'
  | 'unavailable'
  | 'rate-limited'
  | 'server'
  | 'network'
  | 'offline'
  | 'aborted'
  | 'malformed';

export type IntervalsResult<T> = { ok: true; data: T } | { ok: false; code: IntervalsErrorCode };

export const INTERVALS_BASE_URL = 'https://intervals.icu/api/v1';

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 500;
const BACKOFF_JITTER_MS = 250;

export const buildIntervalsAuthHeader = (apiKey: string): string => {
  return `Basic ${btoa(`API_KEY:${apiKey}`)}`;
};

const buildUrl = (path: string, params?: Record<string, string>): string => {
  if (params === undefined) return `${INTERVALS_BASE_URL}${path}`;
  const search = new URLSearchParams(params);
  return `${INTERVALS_BASE_URL}${path}?${search.toString()}`;
};

const classifyStatus = (status: number): IntervalsErrorCode => {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 404) return 'not-found';
  if (status === 422) return 'unavailable';
  if (status === 429) return 'rate-limited';
  return 'server';
};

const isRetryable = (code: IntervalsErrorCode): boolean => {
  return code === 'rate-limited' || code === 'server';
};

const classifyThrown = (error: unknown, signal?: AbortSignal): IntervalsErrorCode => {
  if (signal?.aborted === true) return 'aborted';
  if (error instanceof DOMException && error.name === 'AbortError') return 'aborted';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'offline';
  return 'network';
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const backoffDelay = (attempt: number): number => {
  return BACKOFF_BASE_MS * 2 ** attempt + Math.random() * BACKOFF_JITTER_MS;
};

const requestOnce = async (
  apiKey: string,
  url: string,
  accept: string | undefined,
  signal?: AbortSignal,
): Promise<IntervalsResult<Response>> => {
  const headers: Record<string, string> = { Authorization: buildIntervalsAuthHeader(apiKey) };
  if (accept !== undefined) headers.Accept = accept;

  try {
    const response = await fetch(url, { method: 'GET', credentials: 'omit', headers, signal });
    if (!response.ok) return { ok: false, code: classifyStatus(response.status) };
    return { ok: true, data: response };
  } catch (error) {
    return { ok: false, code: classifyThrown(error, signal) };
  }
};

const request = async (
  apiKey: string,
  url: string,
  accept: string | undefined,
  signal?: AbortSignal,
): Promise<IntervalsResult<Response>> => {
  let last: IntervalsResult<Response> = { ok: false, code: 'network' };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    last = await requestOnce(apiKey, url, accept, signal);
    if (last.ok) return last;
    if (!isRetryable(last.code)) return last;
    if (signal?.aborted === true) return { ok: false, code: 'aborted' };
    if (attempt < MAX_ATTEMPTS - 1) await sleep(backoffDelay(attempt));
  }

  return last;
};

export const intervalsFetchJson = async (
  apiKey: string,
  path: string,
  params?: Record<string, string>,
  signal?: AbortSignal,
): Promise<IntervalsResult<unknown>> => {
  const result = await request(apiKey, buildUrl(path, params), 'application/json', signal);
  if (!result.ok) return result;

  try {
    const json: unknown = await result.data.json();
    return { ok: true, data: json };
  } catch {
    return { ok: false, code: 'malformed' };
  }
};

export const intervalsFetchBytes = async (
  apiKey: string,
  path: string,
  params?: Record<string, string>,
  signal?: AbortSignal,
): Promise<IntervalsResult<ArrayBuffer>> => {
  const result = await request(apiKey, buildUrl(path, params), undefined, signal);
  if (!result.ok) return result;

  try {
    const bytes = await result.data.arrayBuffer();
    return { ok: true, data: bytes };
  } catch (error) {
    return { ok: false, code: classifyThrown(error, signal) };
  }
};
