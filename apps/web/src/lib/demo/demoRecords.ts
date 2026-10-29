import { decode } from '@googlemaps/polyline-codec';
import { z } from 'zod';
import type { SessionLap, SessionRecord, Sport } from '@pacevault/engine/types.ts';
import { haversineDistanceMeters } from '@pacevault/engine/geodesy.ts';
import { movingSeconds } from '@/lib/analysis/movingTime.ts';
import type { DemoStep, DemoWorkout } from './demoSchedule.ts';
import type { SeededRandom } from './seededRandom.ts';
import { MS_PER_SECOND } from '@pacevault/engine/time.ts';

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const demoRouteJsonSchema = z.object({
  key: z.string(),
  name: z.string(),
  sport: z.enum(['running', 'cycling']),
  polyline: z.string(),
  elevations: z.array(z.number()),
});

const demoRoutesJsonSchema = z.object({
  routes: z.array(demoRouteJsonSchema),
  trip: z.array(demoRouteJsonSchema),
  studio: z.array(demoRouteJsonSchema),
});

export type DemoRoutesJson = z.infer<typeof demoRoutesJsonSchema>;

export const parseDemoRoutes = (data: unknown): DemoRoutesJson | undefined => {
  const result = demoRoutesJsonSchema.safeParse(data);
  if (!result.success) return undefined;
  return result.data;
};

export interface DemoRoutePoint {
  lat: number;
  lng: number;
  ele: number;
}

export interface DemoRoute {
  key: string;
  name: string;
  points: DemoRoutePoint[];
  /** Cumulative distance in metres at each point. */
  cumulative: number[];
  length: number;
}

const LOOP_CLOSE_M = 1;

export const prepareRoute = (json: z.infer<typeof demoRouteJsonSchema>): DemoRoute => {
  const points: DemoRoutePoint[] = [];
  decode(json.polyline, 5).forEach(([lat, lng], i) => {
    const ele = json.elevations[i];
    if (ele !== undefined) points.push({ lat, lng, ele });
  });
  const first = points[0];
  const last = points[points.length - 1];
  if (first && last && haversineDistanceMeters({ from: first, to: last }) > LOOP_CLOSE_M) {
    points.push({ ...first });
  }
  const cumulative: number[] = [];
  let length = 0;
  points.forEach((p, i) => {
    const prev = points[i - 1];
    if (prev) length += haversineDistanceMeters({ from: prev, to: p });
    cumulative.push(length);
  });
  return { key: json.key, name: json.name, points, cumulative, length };
};

const bracketIndex = ({
  cumulative,
  distance,
}: {
  cumulative: number[];
  distance: number;
}): { lo: number; hi: number } => {
  let lo = 0;
  let hi = cumulative.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((cumulative[mid] ?? 0) <= distance) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { lo, hi };
};

const interpolatePoint = ({
  a,
  b,
  t,
}: {
  a: DemoRoutePoint;
  b: DemoRoutePoint;
  t: number;
}): DemoRoutePoint => ({
  lat: a.lat + (b.lat - a.lat) * t,
  lng: a.lng + (b.lng - a.lng) * t,
  ele: a.ele + (b.ele - a.ele) * t,
});

const wrappedDistance = ({ distance, length }: { distance: number; length: number }): number => {
  let d = distance % length;
  if (d < 0) d += length;
  return d;
};

/** Position on the route at `distance` metres, wrapping round the loop. */
export const routeAt = ({
  route,
  distance,
}: {
  route: DemoRoute;
  distance: number;
}): DemoRoutePoint => {
  const fallback = route.points[0] ?? { lat: 0, lng: 0, ele: 0 };
  if (route.length <= 0) return fallback;
  const d = wrappedDistance({ distance, length: route.length });
  const bracket = bracketIndex({ cumulative: route.cumulative, distance: d });
  const a = route.points[bracket.lo];
  const b = route.points[bracket.hi];
  if (!a || !b) return fallback;
  const from = route.cumulative[bracket.lo] ?? 0;
  const span = (route.cumulative[bracket.hi] ?? from) - from;
  let t = 0;
  if (span > 0) t = (d - from) / span;
  return interpolatePoint({ a, b, t });
};

const GRADE_HALF_WINDOW_M = 25;

const gradeAt = ({ route, distance }: { route: DemoRoute; distance: number }): number =>
  (routeAt({ route, distance: distance + GRADE_HALF_WINDOW_M }).ele -
    routeAt({ route, distance: distance - GRADE_HALF_WINDOW_M }).ele) /
  (2 * GRADE_HALF_WINDOW_M);

// ---------------------------------------------------------------------------
// Synthesis
// ---------------------------------------------------------------------------

export interface DemoPersona {
  maxHr: number;
  restHr: number;
  ftp: number;
  /** sec/km */
  thresholdPace: number;
}

export interface SimulateInput {
  sport: Sport;
  workout: DemoWorkout;
  route: DemoRoute | undefined;
  persona: DemoPersona;
  rng: SeededRandom;
  /** Per-session form: scales every step's effort. */
  effortScale: number;
  hrRecorded: boolean;
  /** Traffic lights in the first and last kilometres of a city ride. */
  cityStops: boolean;
}

export interface SimulatedSession {
  records: SessionRecord[];
  /** Record index where each step begins (shared with the previous step's end). */
  stepStarts: number[];
  /** Timer seconds from the first to the last record. */
  duration: number;
}

// Rider + bike, rolling resistance, drag area, air density.
const MASS_KG = 69;
const GRAVITY = 9.81;
const CRR = 0.005;
const CDA = 0.36;
const RHO = 1.2;
const MAX_BIKE_SPEED = 16;
const COAST_GRADE = -0.025;
/**
 * Climbs lift steady riding at most to this share of FTP, below the effort detection's leave
 * level (0.80), so steady rides over hills show no efforts.
 */
const CLIMB_EFFORT_CAP = 0.77;

const pedalPower = ({ v, grade }: { v: number; grade: number }): number =>
  v * MASS_KG * GRAVITY * (CRR + grade) + 0.5 * RHO * CDA * v ** 3;

const bikeSpeed = ({ power, grade }: { power: number; grade: number }): number => {
  if (power <= 0) {
    const pull = -MASS_KG * GRAVITY * (CRR + grade);
    if (pull <= 0) return 0;
    return Math.min(MAX_BIKE_SPEED, Math.sqrt((2 * pull) / (RHO * CDA)));
  }
  let lo = 0.3;
  let hi = MAX_BIKE_SPEED;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (pedalPower({ v: mid, grade }) < power) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const HR_RISE_TAU_S = 25;
const HR_FALL_TAU_S = 60;
const HR_DRIFT_PER_HOUR = 0.03;
const STOP_SAMPLE_S = 5;
const RAMP_S = 15;

const runningHrFraction = (effort: number): number => clamp(0.88 + (effort - 1) * 1.2, 0.45, 0.95);

const cyclingHrFraction = (powerRatio: number): number => clamp(0.2 + 0.7 * powerRatio, 0.25, 0.95);

const planStops = ({
  rng,
  total,
}: {
  rng: SeededRandom;
  total: number;
}): Array<{ at: number; seconds: number }> => {
  if (total < 10_000) return [];
  const windows: Array<[number, number]> = [
    [600, 1800],
    [2200, 3800],
    [total - 3800, total - 2200],
    [total - 1800, total - 600],
  ];
  return windows.map(([from, to]) => ({
    at: rng.between(from, to),
    seconds: Math.round(rng.between(15, 45)),
  }));
};

const stepTarget = ({
  step,
  workout,
  route,
}: {
  step: DemoStep;
  workout: DemoWorkout;
  route: DemoRoute | undefined;
}): { distance?: number; duration?: number } => {
  if (step.distance !== undefined) return { distance: step.distance };
  if (step.duration !== undefined) return { duration: step.duration };
  if (route) return { distance: route.length * (workout.loops ?? 1) };
  return { duration: 1800 };
};

interface SimulationState {
  input: SimulateInput;
  thresholdSpeed: number;
  hrr: number;
  stops: Array<{ at: number; seconds: number }>;
  records: SessionRecord[];
  stepStarts: number[];
  t: number;
  d: number;
  v: number;
  hr: number;
  smoothedPowerRatio: number;
  noise: number;
  eleNoise: number;
  coasting: number;
}

const createSimulationState = (input: SimulateInput): SimulationState => {
  const persona = input.persona;
  const hrr = persona.maxHr - persona.restHr;
  const totalDistance = input.workout.steps.reduce((sum, step) => {
    const target = stepTarget({ step, workout: input.workout, route: input.route });
    return sum + (target.distance ?? 0);
  }, 0);
  let stops: Array<{ at: number; seconds: number }> = [];
  if (input.cityStops) stops = planStops({ rng: input.rng, total: totalDistance });
  return {
    input,
    thresholdSpeed: 1000 / persona.thresholdPace,
    hrr,
    stops,
    records: [],
    stepStarts: [],
    t: 0,
    d: 0,
    v: 0,
    hr: persona.restHr + hrr * 0.25,
    smoothedPowerRatio: 0,
    noise: 0,
    eleNoise: 0,
    coasting: 0,
  };
};

const updateHr = ({ state, fraction }: { state: SimulationState; fraction: number }): void => {
  const persona = state.input.persona;
  const target = persona.restHr + state.hrr * (fraction + (HR_DRIFT_PER_HOUR * state.t) / 3600);
  let tau = HR_FALL_TAU_S;
  if (target > state.hr) tau = HR_RISE_TAU_S;
  state.hr += (target - state.hr) / tau + (state.input.rng.next() - 0.5) * 0.8;
};

const pushRecord = ({
  state,
  speed,
  power,
  cadence,
}: {
  state: SimulationState;
  speed: number;
  power: number | undefined;
  cadence: number | undefined;
}): void => {
  const input = state.input;
  const route = input.route;
  const record: SessionRecord = {
    timestamp: state.t,
    timerTime: state.t,
    speed: round(speed, 3),
    distance: round(state.d, 2),
  };
  if (input.hrRecorded) record.hr = Math.round(clamp(state.hr, 40, input.persona.maxHr));
  if (power !== undefined) record.power = power;
  if (cadence !== undefined) record.cadence = cadence;
  if (route) {
    const p = routeAt({ route, distance: state.d });
    state.eleNoise = state.eleNoise * 0.9 + (input.rng.next() - 0.5) * 0.12;
    record.lat = round(p.lat, 7);
    record.lng = round(p.lng, 7);
    record.elevation = round(p.ele + clamp(state.eleNoise, -0.3, 0.3), 1);
  }
  state.records.push(record);
};

const simulateStop = (state: SimulationState): void => {
  const nextStop = state.stops[0];
  if (!nextStop || !(state.d >= nextStop.at)) return;
  state.stops.shift();
  const until = state.t + nextStop.seconds;
  state.v = 0;
  while (state.t < until) {
    const sample = Math.min(STOP_SAMPLE_S, until - state.t);
    for (let s = 0; s < sample; s++) {
      state.t += 1;
      state.smoothedPowerRatio *= 0.97;
      updateHr({ state, fraction: cyclingHrFraction(state.smoothedPowerRatio) });
    }
    pushRecord({ state, speed: 0, power: 0, cadence: 0 });
  }
};

interface SampleInput {
  state: SimulationState;
  effort: number;
  grade: number;
  ramp: number;
  startT: number;
}

interface Sample {
  power: number | undefined;
  cadence: number | undefined;
}

const runningSample = ({ state, effort, grade, ramp, startT }: SampleInput): Sample => {
  let target = state.thresholdSpeed * effort * (1 + state.noise);
  if (grade > 0) {
    target /= 1 + 3.3 * grade;
  } else {
    target *= 1 + Math.min(-grade, 0.05) * 1.5;
  }
  if (startT === 0) target *= ramp;
  state.v += (target - state.v) * 0.3;
  const cadence = Math.round(80 + (state.v - 2.8) * 5 + (state.input.rng.next() - 0.5) * 2);
  updateHr({ state, fraction: runningHrFraction(effort) });
  return { power: undefined, cadence };
};

const updateCoasting = (state: SimulationState): void => {
  if (state.coasting > 0) {
    state.coasting -= 1;
  } else if (state.input.route && state.input.rng.next() < 0.004) {
    state.coasting = Math.round(state.input.rng.between(4, 12));
  }
};

const cyclingSample = ({ state, effort, grade, ramp, startT }: SampleInput): Sample => {
  updateCoasting(state);
  const climbing = Math.min(
    effort * (1 + clamp(grade * 5, 0, 0.35)),
    Math.max(effort, CLIMB_EFFORT_CAP),
  );
  let watts = state.input.persona.ftp * climbing * (1 + state.noise * 2);
  if (state.coasting > 0 || grade < COAST_GRADE) watts = 0;
  if (startT === 0) watts *= ramp;
  const power = Math.max(0, Math.round(watts));
  state.v += (bikeSpeed({ power, grade }) - state.v) * 0.15;
  let cadence = 0;
  if (power > 0) cadence = Math.round(86 + (state.input.rng.next() - 0.5) * 6 + state.noise * 40);
  state.smoothedPowerRatio += (power / state.input.persona.ftp - state.smoothedPowerRatio) * 0.05;
  updateHr({ state, fraction: cyclingHrFraction(state.smoothedPowerRatio) });
  return { power, cadence };
};

const simulateStep = ({ state, step }: { state: SimulationState; step: DemoStep }): void => {
  const input = state.input;
  const route = input.route;
  state.stepStarts.push(state.records.length - 1);
  const target = stepTarget({ step, workout: input.workout, route });
  const startD = state.d;
  const startT = state.t;
  const effort = step.effort * input.effortScale;

  const stepDone = () => {
    if (target.distance !== undefined) return state.d >= startD + target.distance;
    return state.t >= startT + (target.duration ?? 0);
  };

  while (!stepDone()) {
    simulateStop(state);
    state.t += 1;
    state.noise = state.noise * 0.95 + (input.rng.next() - 0.5) * 0.012;
    let grade = 0;
    if (route) grade = gradeAt({ route, distance: state.d });
    const ramp = Math.min(1, 0.4 + (0.6 * (state.t - startT)) / RAMP_S);
    let sample: Sample;
    if (input.sport === 'running') {
      sample = runningSample({ state, effort, grade, ramp, startT });
    } else {
      sample = cyclingSample({ state, effort, grade, ramp, startT });
    }
    state.d += state.v;
    if (target.distance !== undefined) state.d = Math.min(state.d, startD + target.distance);
    pushRecord({ state, speed: state.v, power: sample.power, cadence: sample.cadence });
  }
};

/** 1 Hz records following the workout's steps along the route (or indoors). */
export const simulateSession = (input: SimulateInput): SimulatedSession => {
  const state = createSimulationState(input);
  let startPower: number | undefined = undefined;
  let startCadence: number | undefined = undefined;
  if (input.sport === 'cycling') {
    startPower = 0;
    startCadence = 0;
  }
  pushRecord({ state, speed: 0, power: startPower, cadence: startCadence });
  input.workout.steps.forEach((step) => simulateStep({ state, step }));
  return { records: state.records, stepStarts: state.stepStarts, duration: state.t };
};

// ---------------------------------------------------------------------------
// Laps
// ---------------------------------------------------------------------------

const AUTO_LAP_METERS_BY_SPORT: Record<Sport, number> = { running: 1000, cycling: 5000 };

const autoLapStarts = ({
  records,
  sport,
}: {
  records: SessionRecord[];
  sport: Sport;
}): number[] => {
  const lapDistance = AUTO_LAP_METERS_BY_SPORT[sport];
  const starts = [0];
  let next = lapDistance;
  records.forEach((r, i) => {
    if (r.distance !== undefined && r.distance >= next && i < records.length - 1) {
      starts.push(i);
      next += lapDistance;
    }
  });
  return starts;
};

const buildLap = ({
  records,
  moving,
  span,
  sessionStart,
}: {
  records: SessionRecord[];
  moving: number[];
  span: { lapIndex: number; from: number; to: number; intensity: string };
  sessionStart: number;
}): SessionLap | undefined => {
  const first = records[span.from];
  const last = records[span.to];
  if (!first || !last) return undefined;
  const lap: SessionLap = {
    lapIndex: span.lapIndex,
    startTime: sessionStart + first.timestamp * MS_PER_SECOND,
    endTime: sessionStart + last.timestamp * MS_PER_SECOND,
    totalTimerTime: last.timestamp - first.timestamp,
    totalMovingTime: (moving[span.to] ?? 0) - (moving[span.from] ?? 0),
    distance: round((last.distance ?? 0) - (first.distance ?? 0), 2),
    intensity: span.intensity,
  };
  const hrs: number[] = [];
  for (let i = span.from; i <= span.to; i++) {
    const hr = records[i]?.hr;
    if (hr !== undefined) hrs.push(hr);
  }
  if (hrs.length > 0) {
    lap.minHr = Math.min(...hrs);
    lap.maxHr = Math.max(...hrs);
  }
  return lap;
};

/** Device laps: one per step for structured workouts, auto-laps for steady ones. */
export const buildDemoLaps = ({
  sport,
  workout,
  simulated,
  sessionStart,
}: {
  sport: Sport;
  workout: DemoWorkout;
  simulated: SimulatedSession;
  sessionStart: number;
}): SessionLap[] => {
  const records = simulated.records;
  const lastIndex = records.length - 1;
  if (lastIndex < 1) return [];
  const moving = movingSeconds(records);

  let starts = simulated.stepStarts;
  let intensities = workout.steps.map((step): string => step.intensity);
  if (workout.steps.length === 1) {
    starts = autoLapStarts({ records, sport });
    intensities = starts.map(() => 'active');
  }

  const laps: SessionLap[] = [];
  starts.forEach((from, i) => {
    const to = starts[i + 1] ?? lastIndex;
    if (to <= from) return;
    const lap = buildLap({
      records,
      moving,
      span: { lapIndex: laps.length, from, to, intensity: intensities[i] ?? 'active' },
      sessionStart,
    });
    if (lap) laps.push(lap);
  });
  return laps;
};

// ---------------------------------------------------------------------------
// Session totals
// ---------------------------------------------------------------------------

const ELEVATION_HYSTERESIS_M = 2;

export const elevationTotals = (
  records: SessionRecord[],
): { gain: number; loss: number } | undefined => {
  let ref: number | undefined = undefined;
  let gain = 0;
  let loss = 0;
  for (const r of records) {
    if (r.elevation === undefined) continue;
    if (ref === undefined) {
      ref = r.elevation;
      continue;
    }
    const delta = r.elevation - ref;
    if (delta >= ELEVATION_HYSTERESIS_M) {
      gain += delta;
      ref = r.elevation;
    } else if (delta <= -ELEVATION_HYSTERESIS_M) {
      loss -= delta;
      ref = r.elevation;
    }
  }
  if (ref === undefined) return undefined;
  return { gain: Math.round(gain), loss: Math.round(loss) };
};
