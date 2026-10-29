import { z } from 'zod';
import { SPORTS, type Sport, type TrainingSession } from '@pacevault/engine/types.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';
import { FailedResponseError, type FailedResponseReason } from '@/lib/api/fetchResponse.ts';

const BASE_URL = 'https://intervals.icu/api/v1';
export const MAX_ACTIVITIES_PER_IMPORT = 2000;

export type IntervalsErrorCode = FailedResponseReason | 'network';

export const intervalsErrorCode = (error: unknown): IntervalsErrorCode => {
  if (error instanceof FailedResponseError) return error.reason;
  if (error instanceof TypeError || error instanceof DOMException) return 'network';
  return 'failed';
};

const optStrSchema = z.string().nullish();

const intervalsActivitySchema = z.object({
  id: z.string(),
  name: optStrSchema,
  type: optStrSchema,
  source: optStrSchema,
  file_type: optStrSchema,
  start_date_local: optStrSchema,
});

export type IntervalsActivity = z.infer<typeof intervalsActivitySchema>;

const ACTIVITY_FIELDS = Object.keys(intervalsActivitySchema.shape).join(',');

const intervalsAuthorization = (apiKey: string): string => `Basic ${btoa(`API_KEY:${apiKey}`)}`;

const intervalsRequest = async ({
  apiKey,
  path,
  params,
}: {
  apiKey: string;
  path: string;
  params?: Record<string, string>;
}): Promise<Response> => {
  let url = `${BASE_URL}${path}`;
  if (params !== undefined) url = `${url}?${new URLSearchParams(params).toString()}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'omit',
    headers: { Authorization: intervalsAuthorization(apiKey) },
  });
  if (!response.ok) {
    throw new FailedResponseError({ operation: `intervals.icu GET ${path}`, response });
  }
  return response;
};

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

export const verifyIntervalsKey = async (apiKey: string): Promise<void> => {
  await intervalsRequest({ apiKey, path: '/athlete/0' });
};

export const FULL_HISTORY_OLDEST = '1990-01-01';

export const listIntervalsActivities = async ({
  apiKey,
  oldest = FULL_HISTORY_OLDEST,
}: {
  apiKey: string;
  oldest?: string;
}): Promise<IntervalsActivity[]> => {
  const response = await intervalsRequest({
    apiKey,
    path: '/athlete/0/activities',
    params: {
      oldest,
      fields: ACTIVITY_FIELDS,
    },
  });

  const raw: unknown = await response.json();
  if (!Array.isArray(raw)) return [];

  const activities: IntervalsActivity[] = [];
  for (const entry of raw) {
    const parsed = intervalsActivitySchema.safeParse(entry);
    if (parsed.success && isImportableActivity(parsed.data)) activities.push(parsed.data);
  }

  return activities;
};

const readActivityBody = async (response: Response): Promise<ArrayBuffer> => {
  try {
    return await response.arrayBuffer();
  } catch (error) {
    throw new Error('Reading an intervals.icu FIT file failed', { cause: error });
  }
};

export const downloadActivityFit = async ({
  apiKey,
  activity,
}: {
  apiKey: string;
  activity: IntervalsActivity;
}): Promise<ArrayBuffer> => {
  if (activity.file_type?.toLowerCase() === 'fit') {
    let original: Response | undefined = undefined;
    try {
      original = await intervalsRequest({ apiKey, path: `/activity/${activity.id}/file` });
    } catch (error) {
      if (error instanceof FailedResponseError && error.reason === 'rate-limited') throw error;
    }
    if (original !== undefined) return readActivityBody(original);
  }

  return readActivityBody(
    await intervalsRequest({ apiKey, path: `/activity/${activity.id}/fit-file` }),
  );
};

const BUFFER_DAYS = 14;

const toLocalDate = (ms: number): string => {
  const date = new Date(ms);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const intervalsSyncWindowOldest = (sessions: TrainingSession[]): string | undefined => {
  let newest: number | undefined = undefined;
  for (const session of sessions) {
    if (session.source.kind !== 'intervals') continue;
    if (newest === undefined || session.date > newest) newest = session.date;
  }
  if (newest === undefined) return undefined;
  return toLocalDate(newest - BUFFER_DAYS * MS_PER_DAY);
};
