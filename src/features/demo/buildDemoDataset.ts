import type {
  Gender,
  SessionLap,
  SessionRecord,
  TrainingSession,
} from '@/packages/engine/types.ts';
import { calculateSessionStress } from '@/packages/engine/stress.ts';
import { valueAt, type DatedValue } from '@/packages/engine/datedValue.ts';
import type { UserProfile } from '@/types/index.ts';
import {
  SESSION_DERIVATION_VERSION,
  deriveSessionFieldsFromRecords,
} from '@/packages/engine/sessionDerivation.ts';
import type { ParsedGpxPoint } from '@/packages/gpx/parseGpx.ts';
import { generateFingerprint } from '@/lib/fingerprint.ts';
import {
  DEMO_WEEKS,
  DEMO_WORKOUTS,
  GARDA_TRIP,
  type DemoScheduleEntry,
  type DemoWorkout,
} from './demoSchedule.ts';
import {
  buildDemoLaps,
  elevationTotals,
  prepareRoute,
  simulateSession,
  type DemoPersona,
  type DemoRoute,
  type DemoRoutesJson,
} from './demoRecords.ts';
import { createSeededRandom } from './seededRandom.ts';

/** Fixed seed so every visitor gets the same dataset. */
export const DEMO_SEED = 20_260_518;

export const DEMO_PERSONA: DemoPersona & { gender: Gender; birthYear: number } = {
  gender: 'female',
  birthYear: 1992,
  maxHr: 178,
  restHr: 48,
  ftp: 200,
  thresholdPace: 300,
};

export type DemoSession = Omit<TrainingSession, 'createdAt' | 'isNew'>;

export interface DemoSessionData {
  sessionId: string;
  records: SessionRecord[];
  laps: SessionLap[];
}

export interface DemoDataset {
  profile: Omit<UserProfile, 'id' | 'createdAt'>;
  sessions: DemoSession[];
  sessionData: DemoSessionData[];
  trips: Array<{ name: string; description: string; sessionIds: string[] }>;
  studioRoutes: Array<{ name: string; sourceFileName: string; points: ParsedGpxPoint[] }>;
}

interface PlacedEntry {
  entry: DemoScheduleEntry;
  weeksBeforeEnd: number;
}

const placedEntries = (): PlacedEntry[] =>
  DEMO_WEEKS.flatMap((week) =>
    week.entries.map((entry) => ({ entry, weeksBeforeEnd: week.weeksBeforeEnd })),
  );

const dayOffset = (placed: PlacedEntry): number => placed.entry.weekday - placed.weeksBeforeEnd * 7;

/**
 * Monday of the plan's final week: the latest whole-week shift that leaves the last
 * session on or before yesterday, so nothing lies in the future.
 */
const finalMonday = (today: Date, lastOffset: number): Date => {
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const sinceMonday = (midnight.getDay() + 6) % 7;
  let monday = new Date(
    midnight.getFullYear(),
    midnight.getMonth(),
    midnight.getDate() - sinceMonday,
  );
  const lastDay = () =>
    new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + lastOffset);
  while (lastDay().getTime() >= midnight.getTime()) {
    monday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - 7);
  }
  return monday;
};

const parseStart = (start: string): { hours: number; minutes: number } => {
  const parts = start.split(':');
  return { hours: Number(parts[0] ?? 0), minutes: Number(parts[1] ?? 0) };
};

const startTime = (monday: Date, placed: PlacedEntry, jitterMinutes: number): number => {
  const time = parseStart(placed.entry.start);
  return new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + dayOffset(placed),
    time.hours,
    time.minutes + jitterMinutes,
  ).getTime();
};

const average = (values: number[]): number | undefined => {
  if (values.length === 0) return undefined;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

const DEMO_FTP_STEP = { daysBeforeNewest: 60, ftp: 210 };
const DEMO_WEIGHTS = [
  { daysBeforeNewest: 90, kg: 61 },
  { daysBeforeNewest: 30, kg: 60 },
];

const daysBefore = (day: Date, days: number): number =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate() - days).getTime();

const demoFtpHistory = (newestDay: Date): DatedValue<number>[] => [
  { date: 0, value: DEMO_PERSONA.ftp },
  { date: daysBefore(newestDay, DEMO_FTP_STEP.daysBeforeNewest), value: DEMO_FTP_STEP.ftp },
];

const demoWeightHistory = (newestDay: Date): DatedValue<number>[] =>
  DEMO_WEIGHTS.map((entry) => ({
    date: daysBefore(newestDay, entry.daysBeforeNewest),
    value: entry.kg,
  }));

const buildSession = (
  id: string,
  date: number,
  workout: DemoWorkout,
  records: SessionRecord[],
  ftpHistory: DatedValue<number>[],
): DemoSession => {
  const sport = workout.sport;
  const lastRecord = records[records.length - 1];
  const duration = lastRecord?.timerTime ?? 0;
  const hrs: number[] = [];
  for (const r of records) {
    if (r.hr !== undefined) hrs.push(r.hr);
  }
  const avgHr = average(hrs);
  let roundedAvgHr: number | undefined = undefined;
  let maxHr: number | undefined = undefined;
  if (avgHr !== undefined) {
    roundedAvgHr = Math.round(avgHr);
    maxHr = Math.max(...hrs);
  }

  let stressFtp: number | undefined = undefined;
  if (records.some((r) => r.power !== undefined)) stressFtp = valueAt(ftpHistory, date);
  const stress = calculateSessionStress(
    records,
    duration,
    roundedAvgHr,
    DEMO_PERSONA.restHr,
    DEMO_PERSONA.maxHr,
    DEMO_PERSONA.gender,
    stressFtp,
  );
  const derived = deriveSessionFieldsFromRecords(sport, records);
  const distance = derived.distance;

  let avgSpeed: number | undefined = undefined;
  if (distance !== undefined && duration > 0)
    avgSpeed = Math.round((distance / duration) * 1000) / 1000;
  let avgPace: number | undefined = undefined;
  if (sport === 'running' && avgSpeed !== undefined && avgSpeed > 0) avgPace = 1000 / avgSpeed;

  const session: DemoSession = {
    id,
    name: workout.name,
    sport,
    date,
    duration,
    distance,
    avgHr: roundedAvgHr,
    maxHr,
    avgPower: derived.avgPower,
    normalizedPower: stress.normalizedPower,
    avgCadence: derived.avgCadence,
    avgSpeed,
    avgPace,
    maxSpeed: derived.maxSpeed,
    tss: stress.tss,
    stressMethod: stress.stressMethod,
    isPlanned: false,
    hasDetailedRecords: records.length > 0,
    fingerprint: generateFingerprint(undefined, { sport, date, duration, distance }),
    derivationVersion: SESSION_DERIVATION_VERSION,
    source: { kind: 'demo' },
  };
  if (derived.gap !== undefined) session.gap = derived.gap;
  if (workout.subSport !== undefined) session.subSport = workout.subSport;
  const elevation = elevationTotals(records);
  if (elevation) {
    session.elevationGain = elevation.gain;
    session.elevationLoss = elevation.loss;
  }
  return session;
};

const studioPoints = (route: DemoRoute): ParsedGpxPoint[] =>
  route.points.map((p) => ({ lat: p.lat, lng: p.lng, ele: p.ele, seg: 0 }));

/**
 * The whole demo dataset, deterministic for a given (seed, today, time zone).
 * Pure: reads no clock and no global randomness.
 */
export const buildDemoDataset = (input: {
  seed: number;
  today: Date;
  routes: DemoRoutesJson;
}): DemoDataset => {
  const rng = createSeededRandom(input.seed);
  const routes = new Map<string, DemoRoute>();
  for (const json of [...input.routes.routes, ...input.routes.trip]) {
    routes.set(json.key, prepareRoute(json));
  }
  const cityRoutes = new Set(input.routes.routes.map((r) => r.key));

  const placed = placedEntries();
  const lastOffset = Math.max(...placed.map(dayOffset));
  const monday = finalMonday(input.today, lastOffset);
  const newestDay = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + lastOffset,
  );
  const ftpHistory = demoFtpHistory(newestDay);

  const sessions: DemoSession[] = [];
  const sessionData: DemoSessionData[] = [];
  const gardaIds: string[] = [];

  for (const item of placed) {
    const workout: DemoWorkout = DEMO_WORKOUTS[item.entry.workout];
    const id = rng.uuid();
    const date = startTime(monday, item, Math.floor(rng.between(0, 10)));
    let route: DemoRoute | undefined = undefined;
    if (workout.route !== undefined) route = routes.get(workout.route);
    if (workout.route !== undefined && !route) {
      throw new Error(`Demo route "${workout.route}" is missing`);
    }
    const simulated = simulateSession({
      sport: workout.sport,
      workout,
      route,
      persona: DEMO_PERSONA,
      rng,
      effortScale: rng.between(0.97, 1.03),
      hasHr: item.entry.noHr !== true,
      cityStops:
        workout.sport === 'cycling' && workout.route !== undefined && cityRoutes.has(workout.route),
    });
    sessions.push(buildSession(id, date, workout, simulated.records, ftpHistory));
    sessionData.push({
      sessionId: id,
      records: simulated.records,
      laps: buildDemoLaps(workout.sport, workout, simulated, date),
    });
    if (item.entry.trip === 'garda') gardaIds.push(id);
  }

  return {
    profile: {
      gender: DEMO_PERSONA.gender,
      thresholds: {
        maxHr: [{ date: 0, value: DEMO_PERSONA.maxHr }],
        restHr: [{ date: 0, value: DEMO_PERSONA.restHr }],
        ftp: ftpHistory,
        thresholdPace: [{ date: 0, value: DEMO_PERSONA.thresholdPace }],
      },
      weight: demoWeightHistory(newestDay),
      birthYear: DEMO_PERSONA.birthYear,
      showMetricHelp: true,
    },
    sessions,
    sessionData,
    trips: [
      {
        name: GARDA_TRIP,
        description: 'Five days around Riva del Garda',
        sessionIds: gardaIds,
      },
    ],
    studioRoutes: input.routes.studio.map((json) => ({
      name: json.name,
      sourceFileName: `${json.key}.gpx`,
      points: studioPoints(prepareRoute(json)),
    })),
  };
};
