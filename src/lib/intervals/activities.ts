import { intervalsFetchBytes, intervalsFetchJson, type IntervalsResult } from './client.ts';
import {
  intervalsAthleteSchema,
  parseActivityList,
  type IntervalsAthlete,
  type ParsedActivityList,
} from './intervalsSchemas.ts';
import type { IntervalsWindow } from './intervalsDates.ts';

const ACTIVITY_LIST_FIELDS = [
  'id',
  'name',
  'type',
  'sub_type',
  'start_date_local',
  'source',
  'file_type',
  'moving_time',
  'distance',
  'icu_training_load',
] as const;

const SELF_ATHLETE_ID = '0';

type FitEndpoint = 'original' | 'generated';

interface DownloadedFit {
  data: ArrayBuffer;
  endpoint: FitEndpoint;
}

export const verifyIntervalsKey = async (
  apiKey: string,
  signal?: AbortSignal,
): Promise<IntervalsResult<IntervalsAthlete>> => {
  const result = await intervalsFetchJson(apiKey, `/athlete/${SELF_ATHLETE_ID}`, undefined, signal);
  if (!result.ok) return result;

  const parsed = intervalsAthleteSchema.safeParse(result.data);
  if (!parsed.success) return { ok: false, code: 'malformed' };
  return { ok: true, data: parsed.data };
};

export const listIntervalsActivities = async (
  apiKey: string,
  window: IntervalsWindow,
  signal?: AbortSignal,
): Promise<IntervalsResult<ParsedActivityList>> => {
  const result = await intervalsFetchJson(
    apiKey,
    `/athlete/${SELF_ATHLETE_ID}/activities`,
    {
      oldest: window.oldest,
      newest: window.newest,
      fields: ACTIVITY_LIST_FIELDS.join(','),
    },
    signal,
  );
  if (!result.ok) return result;

  return { ok: true, data: parseActivityList(result.data) };
};

export const downloadActivityFit = async (
  apiKey: string,
  activityId: string,
  preferOriginal: boolean,
  signal?: AbortSignal,
): Promise<IntervalsResult<DownloadedFit>> => {
  if (preferOriginal) {
    const original = await intervalsFetchBytes(
      apiKey,
      `/activity/${activityId}/file`,
      undefined,
      signal,
    );
    if (original.ok) return { ok: true, data: { data: original.data, endpoint: 'original' } };
    if (original.code === 'aborted') return original;
  }

  const generated = await intervalsFetchBytes(
    apiKey,
    `/activity/${activityId}/fit-file`,
    undefined,
    signal,
  );
  if (!generated.ok) return generated;
  return { ok: true, data: { data: generated.data, endpoint: 'generated' } };
};
