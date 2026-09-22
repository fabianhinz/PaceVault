import { z } from 'zod';

const BASE_URL = 'https://intervals.icu/api/v1';
export const MAX_ACTIVITIES_PER_IMPORT = 2000;

export type IntervalsErrorCode = 'unauthorized' | 'rate-limited' | 'network' | 'failed';

export type IntervalsResult<T> = { ok: true; data: T } | { ok: false; code: IntervalsErrorCode };

const optStr = z.string().nullish();

const athleteSchema = z.object({ firstname: optStr });

const activitySchema = z.object({
  id: z.string(),
  name: optStr,
  type: optStr,
  source: optStr,
  file_type: optStr,
});

export type IntervalsActivity = z.infer<typeof activitySchema>;

const ACTIVITY_FIELDS = Object.keys(activitySchema.shape).join(',');

const classify = (status: number): IntervalsErrorCode => {
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate-limited';
  return 'failed';
};

const intervalsRequest = async (
  apiKey: string,
  path: string,
  params?: Record<string, string>,
): Promise<IntervalsResult<Response>> => {
  let url = `${BASE_URL}${path}`;
  if (params !== undefined) url = `${url}?${new URLSearchParams(params).toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      headers: { Authorization: `Basic ${btoa(`API_KEY:${apiKey}`)}` },
    });
    if (!response.ok) return { ok: false, code: classify(response.status) };
    return { ok: true, data: response };
  } catch {
    return { ok: false, code: 'network' };
  }
};

const IMPORTABLE_EXTRAS = new Set(['cyclocross', 'handcycle', 'velomobile', 'treadmill']);

const isImportableActivity = (activity: IntervalsActivity): boolean => {
  if (activity.source === 'STRAVA') return false;
  if (activity.type == null) return true;

  const type = activity.type.trim().toLowerCase();
  if (IMPORTABLE_EXTRAS.has(type)) return true;
  return type.endsWith('ride') || type.endsWith('run');
};

export const verifyIntervalsKey = async (
  apiKey: string,
): Promise<IntervalsResult<{ firstname?: string }>> => {
  const result = await intervalsRequest(apiKey, '/athlete/0');
  if (!result.ok) return result;

  const parsed = athleteSchema.safeParse(await result.data.json());
  if (!parsed.success) return { ok: false, code: 'failed' };
  return { ok: true, data: { firstname: parsed.data.firstname ?? undefined } };
};

export const listIntervalsActivities = async (
  apiKey: string,
): Promise<IntervalsResult<IntervalsActivity[]>> => {
  const result = await intervalsRequest(apiKey, '/athlete/0/activities', {
    oldest: '1990-01-01',
    fields: ACTIVITY_FIELDS,
  });
  if (!result.ok) return result;

  const raw: unknown = await result.data.json();
  if (!Array.isArray(raw)) return { ok: true, data: [] };

  const activities: IntervalsActivity[] = [];
  for (const entry of raw) {
    const parsed = activitySchema.safeParse(entry);
    if (parsed.success && isImportableActivity(parsed.data)) activities.push(parsed.data);
  }

  return { ok: true, data: activities };
};

export const downloadActivityFit = async (
  apiKey: string,
  activity: IntervalsActivity,
): Promise<IntervalsResult<ArrayBuffer>> => {
  if (activity.file_type?.toLowerCase() === 'fit') {
    const original = await intervalsRequest(apiKey, `/activity/${activity.id}/file`);
    if (original.ok) return { ok: true, data: await original.data.arrayBuffer() };
    if (original.code === 'rate-limited') return original;
  }

  const generated = await intervalsRequest(apiKey, `/activity/${activity.id}/fit-file`);
  if (!generated.ok) return generated;
  return { ok: true, data: await generated.data.arrayBuffer() };
};
