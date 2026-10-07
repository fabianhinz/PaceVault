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
} from '@/packages/engine/types.ts';
import { calculateSessionStress } from '@/packages/engine/stress.ts';
import { calculateGAP } from '@/packages/engine/normalize.ts';
import { extractSessionName } from '@/lib/filename.ts';
import { generateFingerprint } from '@/lib/fingerprint.ts';
import {
  fitFileIdSchema,
  fitRecordsSchema,
  fitLapsSchema,
  type FitLapInput,
  type FitRecordInput,
} from './fitSchemas.ts';

interface FitUserProfile {
  weight?: number;
  gender?: 'male' | 'female';
  restingHeartRate?: number;
}

interface ParsedFitResult {
  session: SessionFields;
  records: SessionRecord[];
  laps: SessionLap[];
  fitUserProfile?: FitUserProfile;
  fingerprint: string;
}

export type ParsedFitResultWithMeta = ParsedFitResult & {
  fileName: string;
  rawData: ArrayBuffer;
  source: SessionSource;
};

export class UnsupportedSportError extends Error {
  readonly fitSport: string | undefined;

  constructor(fileName: string, fitSport: string | undefined) {
    super(`Failed to parse FIT file "${fileName}": sport is not supported`);
    this.name = 'UnsupportedSportError';
    this.fitSport = fitSport;
  }
}

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

// Metric derivation priority:
// 1. Calculate from records (most accurate)
// 2. Fall back to session-level FIT value
// 3. Leave undefined (never fabricate)

export const deriveDistanceFromRecords = (records: SessionRecord[]): number | undefined => {
  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i];
    if (!r) continue;
    if (r.distance !== undefined) {
      return r.distance;
    }
  }
  return undefined;
};

export const deriveAvgFromRecords = (
  records: SessionRecord[],
  field: 'power' | 'cadence',
): number | undefined => {
  const values = records.map((r) => r[field]).filter((v): v is number => v !== undefined);
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
};

export const deriveMaxFromRecords = (
  records: SessionRecord[],
  field: 'power' | 'speed',
): number | undefined => {
  const values = records.map((r) => r[field]).filter((v): v is number => v !== undefined);
  if (values.length === 0) return undefined;
  return Math.max(...values);
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
  setIfDefined(record, 'grade', roundTo(r.grade, 2));
  setIfDefined(record, 'timerTime', r.timer_time);
  return record;
};

export const mapFitLaps = (fitLaps: FitLapInput[]): SessionLap[] => {
  return fitLaps.map((lap, index) => {
    const startTime = new Date(lap.start_time).getTime();
    let endTime = new Date(lap.timestamp).getTime();
    if (endTime <= startTime) {
      endTime = startTime + lap.total_elapsed_time * 1000;
    }

    return {
      lapIndex: lap.message_index?.value ?? index,
      startTime,
      endTime,
      totalElapsedTime: lap.total_elapsed_time,
      totalTimerTime: lap.total_timer_time,
      totalMovingTime: lap.total_moving_time,
      distance: lap.total_distance,
      avgSpeed: lap.enhanced_avg_speed ?? lap.avg_speed,
      maxSpeed: lap.enhanced_max_speed ?? lap.max_speed,
      totalAscent: lap.total_ascent,
      minAltitude: lap.enhanced_min_altitude ?? lap.min_altitude,
      maxAltitude: lap.enhanced_max_altitude ?? lap.max_altitude,
      avgAltitude: lap.enhanced_avg_altitude ?? lap.avg_altitude,
      avgGrade: lap.avg_grade,
      avgHr: lap.avg_heart_rate,
      minHr: lap.min_heart_rate,
      maxHr: lap.max_heart_rate,
      avgCadence: lap.avg_cadence,
      maxCadence: lap.max_cadence,
      intensity: lap.intensity,
      repetitionNum: lap.repetition_num,
    };
  });
};

export const parseFitFile = async (
  arrayBuffer: ArrayBuffer,
  fileName: string,
  userProfile: {
    restHr: number;
    maxHr: number;
    gender: Gender;
    ftp?: number;
  },
  meta?: { name?: string },
): Promise<ParsedFitResult> => {
  const parser = new FitParser({
    force: true,
    speedUnit: 'm/s',
    lengthUnit: 'm',
    temperatureUnit: 'celsius',
    elapsedRecordField: true,
    mode: 'list',
  });

  let data;
  try {
    data = await parser.parseAsync(arrayBuffer);
  } catch (err) {
    let errorDetail = 'unknown error';
    if (err instanceof Error) {
      errorDetail = err.message;
    }
    throw new Error(`Failed to parse FIT file "${fileName}": ${errorDetail}`);
  }

  const fitSession = data.sessions?.[0];
  if (!fitSession) {
    throw new Error(`Failed to parse FIT file "${fileName}": session is missing`);
  }

  const sport = mapFitSportToAppSport(fitSession.sport);
  if (!sport) {
    throw new UnsupportedSportError(fileName, fitSession.sport);
  }

  if (!fitSession.start_time) {
    throw new Error(`Failed to parse FIT file "${fileName}": start_time is missing`);
  }
  const sessionDate = new Date(fitSession.start_time).getTime();

  const sessionDuration = fitSession.total_timer_time;
  if (sessionDuration === undefined) {
    throw new Error(`Failed to parse FIT file "${fileName}": total_timer_time is missing`);
  }

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

  // Derive moving time from laps; fall back to timer time per lap when moving time is unavailable
  let movingTime: number | undefined = undefined;
  if (laps.length > 0) {
    movingTime = laps.reduce((sum, lap) => sum + (lap.totalMovingTime ?? lap.totalTimerTime), 0);
  }

  // Calculate stress — use FTP for all sports with power data, not just cycling
  const hasPowerRecords = records.some((r) => r.power !== undefined);
  let stressFtp: number | undefined = undefined;
  if (hasPowerRecords) {
    stressFtp = userProfile.ftp;
  }
  const stressResult = calculateSessionStress(
    records,
    sessionDuration,
    fitSession.avg_heart_rate,
    userProfile.restHr,
    userProfile.maxHr,
    userProfile.gender,
    stressFtp,
  );

  // Compute advanced metrics from records
  let gap: number | undefined = undefined;
  if (sport === 'running') {
    gap = calculateGAP(records);
  }

  const avgSpeed = fitSession.enhanced_avg_speed ?? fitSession.avg_speed;
  const name = meta?.name ?? extractSessionName(fileName);

  const fileIdResult = fitFileIdSchema.safeParse(data.file_ids?.[0]);
  const sessionDistance = deriveDistanceFromRecords(records) ?? fitSession.total_distance;

  let fileIdData: Parameters<typeof generateFingerprint>[0] = undefined;
  if (fileIdResult.success) {
    fileIdData = fileIdResult.data;
  }
  const fingerprint = generateFingerprint(fileIdData, {
    sport,
    date: sessionDate,
    duration: sessionDuration,
    distance: sessionDistance,
  });

  let avgPace: number | undefined = undefined;
  if (sport === 'running' && avgSpeed && avgSpeed > 0) {
    avgPace = 1000 / avgSpeed;
  }

  const session: SessionFields = {
    ...(name !== undefined && { name }),
    sport,
    date: sessionDate,
    duration: sessionDuration,
    distance: sessionDistance,
    avgHr: fitSession.avg_heart_rate,
    maxHr: fitSession.max_heart_rate,
    avgPower: deriveAvgFromRecords(records, 'power') ?? fitSession.avg_power,
    maxPower: deriveMaxFromRecords(records, 'power') ?? fitSession.max_power,
    normalizedPower: stressResult.normalizedPower ?? fitSession.normalized_power,
    avgCadence: deriveAvgFromRecords(records, 'cadence') ?? fitSession.avg_cadence,
    avgSpeed,
    avgPace,
    calories: fitSession.total_calories,
    elevationGain: fitSession.total_ascent,
    elevationLoss: fitSession.total_descent,
    movingTime,
    subSport: fitSession.sub_sport,
    deviceTss: fitSession.training_stress_score,
    deviceIf: fitSession.intensity_factor,
    deviceFtp: fitSession.threshold_power,
    maxSpeed:
      fitSession.enhanced_max_speed ??
      fitSession.max_speed ??
      deriveMaxFromRecords(records, 'speed'),
    minAltitude: fitSession.enhanced_min_altitude ?? fitSession.min_altitude,
    maxAltitude: fitSession.enhanced_max_altitude ?? fitSession.max_altitude,
    avgAltitude: fitSession.enhanced_avg_altitude ?? fitSession.avg_altitude,
    ...(gap !== undefined && { gap }),
    tss: stressResult.tss,
    stressMethod: stressResult.stressMethod,
    isPlanned: false,
    hasDetailedRecords: records.length > 0,
    fingerprint,
  };

  return { session, records, laps, fingerprint };
};
