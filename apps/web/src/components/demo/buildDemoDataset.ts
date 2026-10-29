import type {
  DatedValue,
  Gender,
  SessionLap,
  SessionRecord,
  Sport,
  TrainingSession,
} from '@pacevault/engine/types.ts';
import { stressFromRecords } from '@pacevault/engine/stress.ts';
import { valueAt } from '@pacevault/engine/datedValue.ts';
import type { UserProfile } from '@/types.ts';
import { thresholdsAt } from '@/lib/analysis/thresholdsAt.ts';
import {
  SESSION_DERIVATION_VERSION,
  deriveSessionFieldsFromRecords,
} from '@pacevault/engine/sessionDerivation.ts';
import type { ParsedGpxPoint } from '@pacevault/gpx/parseGpx.ts';
import { generateFingerprint } from '@/parsers/fingerprint.ts';
import {
  DEMO_WEEKS,
  DEMO_WORKOUTS,
  GARDA_TRIP,
  type DemoScheduleEntry,
  type DemoWorkout,
} from '@/lib/demo/demoSchedule.ts';
import {
  buildDemoLaps,
  elevationTotals,
  prepareRoute,
  simulateSession,
  type DemoPersona,
  type DemoRoute,
  type DemoRoutesJson,
  type SimulatedSession,
} from '@/lib/demo/demoRecords.ts';
import { createSeededRandom, type SeededRandom } from '@/lib/demo/seededRandom.ts';

/** Fixed seed so every visitor gets the same dataset. */
export const DEMO_SEED = 20_260_518;

export const DEMO_PERSONA: DemoPersona & {
  gender: Gender;
  birthYear: number;
  thresholdHr: number;
} = {
  gender: 'female',
  birthYear: 1992,
  maxHr: 178,
  restHr: 48,
  ftp: 200,
  thresholdPace: 300,
  // Where the demo HR model puts threshold effort: rest + ~0.88 of the HR reserve.
  thresholdHr: 163,
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
const finalMonday = ({ today, lastOffset }: { today: Date; lastOffset: number }): Date => {
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

const startTime = ({
  monday,
  placed,
  jitterMinutes,
}: {
  monday: Date;
  placed: PlacedEntry;
  jitterMinutes: number;
}): number => {
  const time = parseStart(placed.entry.start);
  return new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + dayOffset(placed),
    time.hours,
    time.minutes + jitterMinutes,
  ).getTime();
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

const averageSpeedAndPace = ({
  sport,
  distance,
  duration,
}: {
  sport: Sport;
  distance: number | undefined;
  duration: number;
}): { avgSpeed: number | undefined; avgPace: number | undefined } => {
  let avgSpeed: number | undefined = undefined;
  if (distance !== undefined && duration > 0)
    avgSpeed = Math.round((distance / duration) * 1000) / 1000;
  let avgPace: number | undefined = undefined;
  if (sport === 'running' && avgSpeed !== undefined && avgSpeed > 0) avgPace = 1000 / avgSpeed;
  return { avgSpeed, avgPace };
};

const withOptionalFields = ({
  session,
  derived,
  workout,
  records,
}: {
  session: DemoSession;
  derived: ReturnType<typeof deriveSessionFieldsFromRecords>;
  workout: DemoWorkout;
  records: SessionRecord[];
}): DemoSession => {
  if (derived.gap !== undefined) session.gap = derived.gap;
  if (workout.subSport !== undefined) session.subSport = workout.subSport;
  const elevation = elevationTotals(records);
  if (elevation) {
    session.elevationGain = elevation.gain;
    session.elevationLoss = elevation.loss;
  }
  return session;
};

const buildSession = ({
  id,
  date,
  workout,
  simulated,
  profile,
}: {
  id: string;
  date: number;
  workout: DemoWorkout;
  simulated: SimulatedSession;
  profile: DemoDataset['profile'];
}): DemoSession => {
  const sport = workout.sport;
  const records = simulated.records;
  const duration = simulated.duration;
  const derived = deriveSessionFieldsFromRecords({ sport, records });
  // The same call as the parser and the recompute, so the startup recompute finds nothing to rewrite.
  const stress = stressFromRecords({
    sport,
    records,
    summary: { durationSec: duration, avgHr: derived.avgHr },
    thresholds: thresholdsAt({ profile, date }),
  });
  const distance = derived.distance;

  const speed = averageSpeedAndPace({ sport, distance, duration });

  const session: DemoSession = {
    id,
    name: workout.name,
    sport,
    date,
    duration,
    distance,
    avgHr: derived.avgHr,
    maxHr: derived.maxHr,
    avgPower: derived.avgPower,
    normalizedPower: stress.normalizedPower,
    avgCadence: derived.avgCadence,
    avgSpeed: speed.avgSpeed,
    avgPace: speed.avgPace,
    maxSpeed: derived.maxSpeed,
    tss: stress.tss,
    stressMethod: stress.stressMethod,
    isPlanned: false,
    hasDetailedRecords: records.length > 0,
    fingerprint: generateFingerprint({
      fileId: undefined,
      fallback: { sport, date, duration, distance },
    }),
    derivationVersion: SESSION_DERIVATION_VERSION,
    source: { kind: 'demo' },
  };
  return withOptionalFields({ session, derived, workout, records });
};

const studioPoints = (route: DemoRoute): ParsedGpxPoint[] =>
  route.points.map((p) => ({ lat: p.lat, lng: p.lng, ele: p.ele, seg: 0 }));

const indexRoutes = (
  json: DemoRoutesJson,
): { routes: Map<string, DemoRoute>; cityRoutes: Set<string> } => {
  const routes = new Map<string, DemoRoute>();
  for (const route of [...json.routes, ...json.trip]) {
    routes.set(route.key, prepareRoute(route));
  }
  const cityRoutes = new Set(json.routes.map((r) => r.key));
  return { routes, cityRoutes };
};

const demoProfile = ({
  newestDay,
  ftpHistory,
}: {
  newestDay: Date;
  ftpHistory: DatedValue<number>[];
}): DemoDataset['profile'] => ({
  gender: DEMO_PERSONA.gender,
  thresholds: {
    maxHr: [{ date: 0, value: DEMO_PERSONA.maxHr }],
    restHr: [{ date: 0, value: DEMO_PERSONA.restHr }],
    thresholdHr: [{ date: 0, value: DEMO_PERSONA.thresholdHr }],
    ftp: ftpHistory,
    thresholdPace: [{ date: 0, value: DEMO_PERSONA.thresholdPace }],
  },
  weight: demoWeightHistory(newestDay),
  birthYear: DEMO_PERSONA.birthYear,
  showMetricHelp: true,
});

interface PlacementContext {
  rng: SeededRandom;
  monday: Date;
  routes: Map<string, DemoRoute>;
  cityRoutes: Set<string>;
  ftpHistory: DatedValue<number>[];
  profile: DemoDataset['profile'];
}

const placeSessions = ({
  placed,
  context,
}: {
  placed: PlacedEntry[];
  context: PlacementContext;
}): { sessions: DemoSession[]; sessionData: DemoSessionData[]; gardaIds: string[] } => {
  const rng = context.rng;
  const sessions: DemoSession[] = [];
  const sessionData: DemoSessionData[] = [];
  const gardaIds: string[] = [];

  for (const item of placed) {
    const workout: DemoWorkout = DEMO_WORKOUTS[item.entry.workout];
    const id = rng.uuid();
    const date = startTime({
      monday: context.monday,
      placed: item,
      jitterMinutes: Math.floor(rng.between(0, 10)),
    });
    let route: DemoRoute | undefined = undefined;
    if (workout.route !== undefined) route = context.routes.get(workout.route);
    if (workout.route !== undefined && !route) {
      throw new Error(`Demo route "${workout.route}" is missing`);
    }
    const simulated = simulateSession({
      sport: workout.sport,
      workout,
      route,
      persona: {
        ...DEMO_PERSONA,
        ftp: valueAt({ history: context.ftpHistory, date }) ?? DEMO_PERSONA.ftp,
      },
      rng,
      effortScale: rng.between(0.97, 1.03),
      hrRecorded: item.entry.noHr !== true,
      cityStops:
        workout.sport === 'cycling' &&
        workout.route !== undefined &&
        context.cityRoutes.has(workout.route),
    });
    sessions.push(buildSession({ id, date, workout, simulated, profile: context.profile }));
    sessionData.push({
      sessionId: id,
      records: simulated.records,
      laps: buildDemoLaps({ sport: workout.sport, workout, simulated, sessionStart: date }),
    });
    if (item.entry.trip === 'garda') gardaIds.push(id);
  }
  return { sessions, sessionData, gardaIds };
};

/**
 * The whole demo dataset, deterministic for a given (seed, today, time zone).
 * Pure: reads no clock and no global randomness.
 */
export const buildDemoDataset = ({
  seed,
  today,
  routes,
}: {
  seed: number;
  today: Date;
  routes: DemoRoutesJson;
}): DemoDataset => {
  const rng = createSeededRandom(seed);
  const indexed = indexRoutes(routes);
  const placed = placedEntries();
  const lastOffset = Math.max(...placed.map(dayOffset));
  const monday = finalMonday({ today, lastOffset });
  const newestDay = new Date(
    monday.getFullYear(),
    monday.getMonth(),
    monday.getDate() + lastOffset,
  );
  const ftpHistory = demoFtpHistory(newestDay);
  const profile = demoProfile({ newestDay, ftpHistory });
  const placedSessions = placeSessions({
    placed,
    context: {
      rng,
      monday,
      routes: indexed.routes,
      cityRoutes: indexed.cityRoutes,
      ftpHistory,
      profile,
    },
  });

  return {
    profile,
    sessions: placedSessions.sessions,
    sessionData: placedSessions.sessionData,
    trips: [
      {
        name: GARDA_TRIP,
        description: 'Five days around Riva del Garda',
        sessionIds: placedSessions.gardaIds,
      },
    ],
    studioRoutes: routes.studio.map((json) => ({
      name: json.name,
      sourceFileName: `${json.key}.gpx`,
      points: studioPoints(prepareRoute(json)),
    })),
  };
};
