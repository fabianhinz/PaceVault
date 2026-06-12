import { v4 } from 'uuid';
import FitParser from 'fit-file-parser';
import type {
  TrainingSession,
  SessionRecord,
  SessionLap,
  Sport,
  Gender,
} from '@/packages/engine/types.ts';
import { validateRecords } from '@/lib/validation.ts';
import { calculateSessionStress } from '@/packages/engine/stress.ts';
import { calculateGAP } from '@/packages/engine/normalize.ts';
import { extractSessionName } from '@/lib/filename.ts';
import { generateFingerprint } from '@/lib/fingerprint.ts';
import {
  fitFileIdSchema,
  fitRecordsSchema,
  fitLapsSchema,
  type FitLapInput,
} from './fitSchemas.ts';

export interface FitUserProfile {
  weight?: number;
  gender?: 'male' | 'female';
  restingHeartRate?: number;
}

export interface ParsedFitResult {
  session: Omit<TrainingSession, 'id' | 'createdAt'>;
  records: SessionRecord[];
  laps: SessionLap[];
  fitUserProfile?: FitUserProfile;
  fingerprint: string;
}

export type ParsedFitResultWithMeta = ParsedFitResult & { fileName: string; rawData: ArrayBuffer };

const mapFitSportToAppSport = (fitSport?: string): Sport | undefined => {
  switch (fitSport) {
    case 'running':
      return 'running';
    case 'cycling':
      return 'cycling';
    default:
      return;
  }
};

// Metric derivation priority:
// 1. Calculate from records (most accurate)
// 2. Fall back to session-level FIT value
// 3. Leave undefined (never fabricate)

export const deriveDistanceFromRecords = (records: SessionRecord[]): number => {
  for (let i = records.length - 1; i >= 0; i--) {
    const r = records[i];
    if (!r) continue;
    if (r.distance !== undefined && r.distance > 0) {
      return r.distance;
    }
  }
  return 0;
};

export const deriveAvgFromRecords = (
  records: SessionRecord[],
  field: 'power' | 'cadence',
): number | undefined => {
  const values = records.map((r) => r[field]).filter((v): v is number => v !== undefined && v > 0);
  if (values.length === 0) return undefined;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
};

export const deriveMaxFromRecords = (
  records: SessionRecord[],
  field: 'power' | 'speed',
): number | undefined => {
  const values = records.map((r) => r[field]).filter((v): v is number => v !== undefined && v > 0);
  if (values.length === 0) return undefined;
  return Math.max(...values);
};

export const mapFitLaps = (fitLaps: FitLapInput[], sessionId: string): SessionLap[] => {
  return fitLaps.map((lap, index) => {
    let startTime = 0;
    if (lap.start_time) {
      startTime = new Date(lap.start_time).getTime();
    }

    let endTime = 0;
    if (lap.timestamp) {
      endTime = new Date(lap.timestamp).getTime();
    }

    return {
      sessionId,
      lapIndex: lap.message_index?.value ?? index,
      startTime,
      endTime,
      totalElapsedTime: lap.total_elapsed_time ?? 0,
      totalTimerTime: lap.total_timer_time ?? 0,
      totalMovingTime: lap.total_moving_time,
      distance: lap.total_distance ?? 0,
      avgSpeed: lap.enhanced_avg_speed ?? lap.avg_speed ?? 0,
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
  const fitRecords = data.records ?? [];
  const sessionId = v4();

  const sport = mapFitSportToAppSport(fitSession?.sport);
  if (!sport) {
    throw new Error(`Failed to parse FIT file "${fileName}": sport is not supported`);
  }

  let sessionDate: number | undefined = undefined;
  if (fitSession?.start_time) {
    sessionDate = new Date(fitSession.start_time).getTime();
  }
  if (sessionDate === undefined) {
    throw new Error(`Failed to parse FIT file "${fileName}": start_time is missing`);
  }

  // Transform FIT records to app records
  const recordsResult = fitRecordsSchema.safeParse(fitRecords);
  let records: SessionRecord[] = [];
  if (recordsResult.success) {
    records = recordsResult.data.map((r) => ({
      sessionId,
      timestamp: r.elapsed_time ?? 0,
      hr: r.heart_rate,
      power: r.power,
      cadence: r.cadence,
      speed: r.enhanced_speed ?? r.speed,
      lat: r.position_lat,
      lng: r.position_long,
      elevation: r.enhanced_altitude ?? r.altitude,
      distance: r.distance,
      grade: r.grade,
      timerTime: r.timer_time,
    }));
  }

  // Extract laps
  const lapsResult = fitLapsSchema.safeParse(data.laps ?? []);
  let lapsInput: FitLapInput[] = [];
  if (lapsResult.success) {
    lapsInput = lapsResult.data;
  }
  const laps = mapFitLaps(lapsInput, sessionId);

  // Derive moving time from laps; fall back to timer time per lap when moving time is unavailable
  let movingTime: number | undefined = undefined;
  if (laps.length > 0) {
    movingTime = laps.reduce((sum, lap) => sum + (lap.totalMovingTime ?? lap.totalTimerTime), 0);
  }

  // Validate sensor data
  const sensorWarnings = validateRecords(records, sport).map((w) => w.message);

  // Calculate stress — use FTP for all sports with power data, not just cycling
  const hasPowerRecords = records.some((r) => r.power !== undefined && r.power > 0);
  let stressFtp: number | undefined = undefined;
  if (hasPowerRecords) {
    stressFtp = userProfile.ftp;
  }
  const stressResult = calculateSessionStress(
    records,
    fitSession?.total_timer_time ?? fitSession?.total_elapsed_time ?? 0,
    fitSession?.avg_heart_rate,
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

  const avgSpeed = fitSession?.enhanced_avg_speed ?? fitSession?.avg_speed;
  const name = extractSessionName(fileName);

  const fileIdResult = fitFileIdSchema.safeParse(data.file_ids?.[0]);
  const sessionDuration = fitSession?.total_timer_time ?? fitSession?.total_elapsed_time ?? 0;
  const sessionDistance = deriveDistanceFromRecords(records);

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

  const session: Omit<TrainingSession, 'id' | 'createdAt'> = {
    ...(name !== undefined && { name }),
    sport,
    date: sessionDate,
    duration: sessionDuration,
    distance: sessionDistance,
    avgHr: fitSession?.avg_heart_rate,
    maxHr: fitSession?.max_heart_rate,
    avgPower: deriveAvgFromRecords(records, 'power') ?? fitSession?.avg_power,
    maxPower: deriveMaxFromRecords(records, 'power') ?? fitSession?.max_power,
    normalizedPower: stressResult.normalizedPower ?? fitSession?.normalized_power,
    avgCadence: deriveAvgFromRecords(records, 'cadence') ?? fitSession?.avg_cadence,
    avgSpeed,
    avgPace,
    calories: fitSession?.total_calories,
    elevationGain: fitSession?.total_ascent,
    elevationLoss: fitSession?.total_descent,
    movingTime,
    subSport: fitSession?.sub_sport,
    deviceTss: fitSession?.training_stress_score,
    deviceIf: fitSession?.intensity_factor,
    deviceFtp: fitSession?.threshold_power,
    maxSpeed:
      fitSession?.enhanced_max_speed ??
      fitSession?.max_speed ??
      deriveMaxFromRecords(records, 'speed'),
    minAltitude: fitSession?.enhanced_min_altitude ?? fitSession?.min_altitude,
    maxAltitude: fitSession?.enhanced_max_altitude ?? fitSession?.max_altitude,
    avgAltitude: fitSession?.enhanced_avg_altitude ?? fitSession?.avg_altitude,
    ...(gap !== undefined && { gap }),
    tss: stressResult.tss,
    stressMethod: stressResult.stressMethod,
    sensorWarnings,
    isPlanned: false,
    hasDetailedRecords: records.length > 0,
    fingerprint,
  };

  return { session, records, laps, fingerprint };
};
