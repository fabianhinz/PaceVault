import { z } from 'zod';
import { SPORTS, type Sport } from '@/packages/engine/types.ts';

const BASE_URL = 'https://intervals.icu/api/v1';
export const MAX_ACTIVITIES_PER_IMPORT = 2000;

export type IntervalsErrorCode = 'unauthorized' | 'rate-limited' | 'network' | 'failed';

type IntervalsResult<T> = { ok: true; data: T } | { ok: false; code: IntervalsErrorCode };

const optStr = z.string().nullish();

const activitySchema = z.object({
  id: z.string(),
  name: optStr,
  type: optStr,
  source: optStr,
  file_type: optStr,
  start_date_local: optStr,
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

// Activity.type is an untyped string in the OpenAPI spec; the values come from the shared sport enum:
// curl -s https://intervals.icu/api/v1/docs | jq '.components.schemas.SportInfo.properties.type.enum'
const INTERVALS_TYPES_BY_SPORT: Record<Sport, readonly string[]> = {
  running: ['Run', 'TrailRun', 'VirtualRun'],
  cycling: [
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
  ],
};

const IMPORTABLE_TYPES = new Set(SPORTS.flatMap((sport) => INTERVALS_TYPES_BY_SPORT[sport]));

const isImportableActivity = (activity: IntervalsActivity): boolean => {
  if (activity.source === 'STRAVA') return false;
  if (activity.type == null) return true;
  return IMPORTABLE_TYPES.has(activity.type);
};

export const verifyIntervalsKey = async (apiKey: string): Promise<IntervalsResult<true>> => {
  const result = await intervalsRequest(apiKey, '/athlete/0');
  if (!result.ok) return result;
  return { ok: true, data: true };
};

export const FULL_HISTORY_OLDEST = '1990-01-01';

export const listIntervalsActivities = async (
  apiKey: string,
  oldest: string = FULL_HISTORY_OLDEST,
): Promise<IntervalsResult<IntervalsActivity[]>> => {
  const result = await intervalsRequest(apiKey, '/athlete/0/activities', {
    oldest,
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
