import FitParser from 'fit-file-parser';
import type { z } from 'zod';
import {
  SPORTS,
  type SessionFields,
  type SessionSource,
  type SessionRecord,
  type SessionLap,
  type Sport,
  type Gender,
} from '@pacevault/engine/types.ts';
import { stressFromRecords } from '@pacevault/engine/stress.ts';
import {
  SESSION_DERIVATION_VERSION,
  deriveSessionFieldsFromRecords,
} from '@pacevault/engine/sessionDerivation.ts';
import { extractSessionName } from '@/parsers/filename.ts';
import { generateFingerprint } from '@/parsers/fingerprint.ts';
import {
  fitFileIdSchema,
  fitRecordsSchema,
  fitLapsSchema,
  type FitLapInput,
  type FitRecordInput,
} from './fitSchemas.ts';
import { MS_PER_SECOND } from '@pacevault/engine/time.ts';

export interface ParsedFitResult {
  session: SessionFields;
  records: SessionRecord[];
  laps: SessionLap[];
  fingerprint: string;
}

export type ParsedFitResultWithMeta = ParsedFitResult & {
  fileName: string;
  rawData: ArrayBuffer;
  source: SessionSource;
};

const FIT_SPORT_BY_SPORT: Record<Sport, string> = {
  running: 'running',
  cycling: 'cycling',
};

const describeIssue = (error: z.ZodError): string => {
  const issue = error.issues[0];
  if (!issue) return '';
  return `${issue.path.join('.')} (${issue.message})`;
};

const mapFitSportToAppSport = (fitSport?: string): Sport | undefined => {
  return SPORTS.find((sport) => FIT_SPORT_BY_SPORT[sport] === fitSport);
};

const roundTo = (value: number | undefined, decimals: number): number | undefined => {
  if (value === undefined) return undefined;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const setIfDefined = <K extends keyof SessionRecord>(
  record: SessionRecord,
  key: K,
  value: SessionRecord[K] | undefined,
) => {
  if (value !== undefined) record[key] = value;
};

const mapFitRecord = (r: FitRecordInput): SessionRecord => {
  const record: SessionRecord = { timestamp: r.elapsed_time };
  setIfDefined(record, 'hr', r.heart_rate);
  setIfDefined(record, 'power', r.power);
  setIfDefined(record, 'cadence', r.cadence);
  setIfDefined(record, 'speed', roundTo(r.enhanced_speed ?? r.speed, 3));
  setIfDefined(record, 'lat', roundTo(r.position_lat, 7));
  setIfDefined(record, 'lng', roundTo(r.position_long, 7));
  setIfDefined(record, 'elevation', roundTo(r.enhanced_altitude ?? r.altitude, 1));
  setIfDefined(record, 'distance', roundTo(r.distance, 2));
  setIfDefined(record, 'timerTime', r.timer_time);
  return record;
};

export const mapFitLaps = (fitLaps: FitLapInput[]): SessionLap[] => {
  return fitLaps.map((lap, index) => {
    const startTime = new Date(lap.start_time).getTime();
    let endTime = new Date(lap.timestamp).getTime();
    if (endTime <= startTime) {
      endTime = startTime + lap.total_elapsed_time * MS_PER_SECOND;
    }

    return {
      lapIndex: lap.message_index?.value ?? index,
      startTime,
      endTime,
      totalTimerTime: lap.total_timer_time,
      totalMovingTime: lap.total_moving_time,
      distance: lap.total_distance,
      minHr: lap.min_heart_rate,
      maxHr: lap.max_heart_rate,
      intensity: lap.intensity,
    };
  });
};

type FitData = Awaited<ReturnType<FitParser['parseAsync']>>;
type FitSession = NonNullable<FitData['sessions']>[number];

export interface FitParseProfile {
  restHr: number;
  maxHr: number;
  gender: Gender;
  ftp?: number;
  thresholdHr?: number;
}

const decodeFit = async ({
  arrayBuffer,
  fileName,
}: {
  arrayBuffer: ArrayBuffer;
  fileName: string;
}): Promise<FitData> => {
  const parser = new FitParser({
    force: true,
    speedUnit: 'm/s',
    lengthUnit: 'm',
    temperatureUnit: 'celsius',
    elapsedRecordField: true,
    mode: 'list',
  });
  try {
    return await parser.parseAsync(arrayBuffer);
  } catch (err) {
    throw new Error(`Failed to parse FIT file "${fileName}": the decoder rejected it`, {
      cause: err,
    });
  }
};

interface RequiredSessionFields {
  fitSession: FitSession;
  sport: Sport;
  sessionDate: number;
  sessionDuration: number;
}

const requiredSessionFields = ({
  data,
  fileName,
}: {
  data: FitData;
  fileName: string;
}): RequiredSessionFields => {
  const fitSession = data.sessions?.[0];
  if (!fitSession) {
    throw new Error(`Failed to parse FIT file "${fileName}": session is missing`);
  }

  const sport = mapFitSportToAppSport(fitSession.sport);
  if (!sport) {
    throw new Error(`Failed to parse FIT file "${fileName}": sport is not supported`);
  }

  if (!fitSession.start_time) {
    throw new Error(`Failed to parse FIT file "${fileName}": start_time is missing`);
  }
  const sessionDate = new Date(fitSession.start_time).getTime();

  const sessionDuration = fitSession.total_timer_time;
  if (sessionDuration === undefined) {
    throw new Error(`Failed to parse FIT file "${fileName}": total_timer_time is missing`);
  }
  return { fitSession, sport, sessionDate, sessionDuration };
};

const parseRecordsAndLaps = ({
  data,
  fileName,
}: {
  data: FitData;
  fileName: string;
}): { records: SessionRecord[]; laps: SessionLap[] } => {
  const recordsResult = fitRecordsSchema.safeParse(data.records ?? []);
  if (!recordsResult.success) {
    throw new Error(
      `Failed to parse FIT file "${fileName}": invalid record ${describeIssue(recordsResult.error)}`,
    );
  }
  const records = recordsResult.data.map(mapFitRecord);

  const lapsResult = fitLapsSchema.safeParse(data.laps ?? []);
  if (!lapsResult.success) {
    throw new Error(
      `Failed to parse FIT file "${fileName}": invalid lap ${describeIssue(lapsResult.error)}`,
    );
  }
  const laps = mapFitLaps(lapsResult.data);
  return { records, laps };
};

const sessionFingerprint = ({
  data,
  required,
  sessionDistance,
}: {
  data: FitData;
  required: RequiredSessionFields;
  sessionDistance: number | undefined;
}): string => {
  const fileIdResult = fitFileIdSchema.safeParse(data.file_ids?.[0]);
  let fileIdData: Parameters<typeof generateFingerprint>[0]['fileId'] = undefined;
  if (fileIdResult.success) {
    fileIdData = fileIdResult.data;
  }
  return generateFingerprint({
    fileId: fileIdData,
    fallback: {
      sport: required.sport,
      date: required.sessionDate,
      duration: required.sessionDuration,
      distance: sessionDistance,
    },
  });
};

const averagePace = ({
  sport,
  avgSpeed,
}: {
  sport: Sport;
  avgSpeed: number | undefined;
}): number | undefined => {
  if (sport === 'running' && avgSpeed && avgSpeed > 0) {
    return 1000 / avgSpeed;
  }
  return undefined;
};

export const parseFitFile = async ({
  arrayBuffer,
  fileName,
  profileAt,
  meta,
}: {
  arrayBuffer: ArrayBuffer;
  fileName: string;
  profileAt: (date: number) => FitParseProfile;
  meta?: { name?: string };
}): Promise<ParsedFitResult> => {
  const data = await decodeFit({ arrayBuffer, fileName });
  const required = requiredSessionFields({ data, fileName });
  const parsed = parseRecordsAndLaps({ data, fileName });
  const derived = deriveSessionFieldsFromRecords({
    sport: required.sport,
    records: parsed.records,
  });
  const avgHr = required.fitSession.avg_heart_rate ?? derived.avgHr;
  const stressResult = stressFromRecords({
    sport: required.sport,
    records: parsed.records,
    summary: { durationSec: required.sessionDuration, avgHr },
    thresholds: profileAt(required.sessionDate),
  });
  const avgSpeed = required.fitSession.enhanced_avg_speed ?? required.fitSession.avg_speed;
  const name = meta?.name ?? extractSessionName(fileName);
  const sessionDistance = derived.distance ?? required.fitSession.total_distance;
  const fingerprint = sessionFingerprint({ data, required, sessionDistance });

  const session: SessionFields = {
    ...(name !== undefined && { name }),
    sport: required.sport,
    date: required.sessionDate,
    duration: required.sessionDuration,
    distance: sessionDistance,
    avgHr,
    maxHr: required.fitSession.max_heart_rate ?? derived.maxHr,
    avgPower: derived.avgPower ?? required.fitSession.avg_power,
    normalizedPower: stressResult.normalizedPower,
    avgCadence: derived.avgCadence ?? required.fitSession.avg_cadence,
    avgSpeed,
    avgPace: averagePace({ sport: required.sport, avgSpeed }),
    elevationGain: required.fitSession.total_ascent,
    elevationLoss: required.fitSession.total_descent,
    subSport: required.fitSession.sub_sport,
    maxSpeed:
      required.fitSession.enhanced_max_speed ?? required.fitSession.max_speed ?? derived.maxSpeed,
    ...(derived.gap !== undefined && { gap: derived.gap }),
    tss: stressResult.tss,
    stressMethod: stressResult.stressMethod,
    isPlanned: false,
    hasDetailedRecords: parsed.records.length > 0,
    fingerprint,
    derivationVersion: SESSION_DERIVATION_VERSION,
  };

  return { session, records: parsed.records, laps: parsed.laps, fingerprint };
};
