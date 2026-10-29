import type { Sport } from '@pacevault/engine/types.ts';

// The 52-week demo plan as data. `buildDemoDataset` expands it; nothing here runs logic.
// Names are stored on the sessions as plain English data (README audience), not i18n.

export const FLAUCHER_EASY = 'Flaucher easy';
export const ISAR_800S = '6×800 m Isar';
export const STARNBERGER_LONG_RIDE = 'Starnberger See long ride';
export const TEGERNSEE_LOOP = 'Tegernsee loop';
export const GARDA_TRIP = 'Lake Garda';

export type DemoLapIntensity = 'warmup' | 'active' | 'rest' | 'cooldown';

/**
 * One block of a workout. `effort` is a fraction of threshold speed (running) or FTP
 * (cycling). A step ends after `distance` metres or `duration` seconds; a step with
 * neither runs to the end of the route (`loops` times round it).
 */
export interface DemoStep {
  intensity: DemoLapIntensity;
  effort: number;
  distance?: number;
  duration?: number;
}

export interface DemoWorkout {
  name: string;
  sport: Sport;
  /** Route key in `demoRoutes.json`; missing for indoor sessions. */
  route?: string;
  loops?: number;
  subSport?: 'treadmill' | 'indoor_cycling';
  /** One step = steady session with device auto-laps; several = one lap per step. */
  steps: DemoStep[];
}

export interface DemoScheduleEntry {
  /** 0 = Monday … 6 = Sunday */
  weekday: number;
  /** Local wall-clock start time, `HH:MM`. */
  start: string;
  workout: DemoWorkoutKey;
  /** Ride without a chest strap: power only, no HR. */
  noHr?: boolean;
  trip?: 'garda';
}

export interface DemoWeek {
  /** Weeks before the final week: 0 = last week of the plan. */
  weeksBeforeEnd: number;
  entries: DemoScheduleEntry[];
}

const steady = (effort: number): DemoStep[] => [{ intensity: 'active', effort }];

const timed = ({ effort, duration }: { effort: number; duration: number }): DemoStep[] => [
  { intensity: 'active', effort, duration },
];

export const DEMO_WORKOUTS = {
  flaucherEasy: { name: FLAUCHER_EASY, sport: 'running', route: 'flaucher', steps: steady(0.84) },
  isarSouthEasy: {
    name: 'Isar south easy',
    sport: 'running',
    route: 'isar-south',
    steps: steady(0.86),
  },
  isarNorthRecovery: {
    name: 'Isar north recovery',
    sport: 'running',
    route: 'isar-north',
    steps: steady(0.78),
  },
  westparkEasy: { name: 'Westpark easy', sport: 'running', route: 'westpark', steps: steady(0.85) },
  theresienwieseShakeout: {
    name: 'Theresienwiese shakeout',
    sport: 'running',
    route: 'theresienwiese',
    steps: steady(0.82),
  },
  englischerGarten: {
    name: 'Englischer Garten run',
    sport: 'running',
    route: 'englischer-garten',
    steps: steady(0.88),
  },
  olympiaparkLong: {
    name: 'Olympiapark long run',
    sport: 'running',
    route: 'olympiapark',
    steps: steady(0.83),
  },
  isarLong: { name: 'Isar long run', sport: 'running', route: 'isar-long', steps: steady(0.84) },
  halfMarathon: {
    name: 'Half marathon race',
    sport: 'running',
    route: 'isar-long',
    steps: [{ intensity: 'active', effort: 0.98, distance: 21097.5 }],
  },
  isar800s: {
    name: ISAR_800S,
    sport: 'running',
    route: 'flaucher',
    steps: [
      { intensity: 'warmup', effort: 0.8, distance: 2000 },
      { intensity: 'active', effort: 1.12, distance: 800 },
      { intensity: 'rest', effort: 0.6, distance: 400 },
      { intensity: 'active', effort: 1.12, distance: 800 },
      { intensity: 'rest', effort: 0.6, distance: 400 },
      { intensity: 'active', effort: 1.12, distance: 800 },
      { intensity: 'rest', effort: 0.6, distance: 400 },
      { intensity: 'active', effort: 1.12, distance: 800 },
      { intensity: 'rest', effort: 0.6, distance: 400 },
      { intensity: 'active', effort: 1.12, distance: 800 },
      { intensity: 'rest', effort: 0.6, distance: 400 },
      { intensity: 'active', effort: 1.12, distance: 800 },
      { intensity: 'cooldown', effort: 0.76, distance: 1500 },
    ],
  },
  isar1ks: {
    name: '5×1 km Isar',
    sport: 'running',
    route: 'isar-south',
    steps: [
      { intensity: 'warmup', effort: 0.8, distance: 2000 },
      { intensity: 'active', effort: 1.06, distance: 1000 },
      { intensity: 'rest', effort: 0.55, duration: 90 },
      { intensity: 'active', effort: 1.06, distance: 1000 },
      { intensity: 'rest', effort: 0.55, duration: 90 },
      { intensity: 'active', effort: 1.06, distance: 1000 },
      { intensity: 'rest', effort: 0.55, duration: 90 },
      { intensity: 'active', effort: 1.06, distance: 1000 },
      { intensity: 'rest', effort: 0.55, duration: 90 },
      { intensity: 'active', effort: 1.06, distance: 1000 },
      { intensity: 'cooldown', effort: 0.76, distance: 1500 },
    ],
  },
  tempo2ks: {
    name: '3×2 km tempo',
    sport: 'running',
    route: 'isar-north',
    steps: [
      { intensity: 'warmup', effort: 0.8, distance: 2000 },
      { intensity: 'active', effort: 0.97, distance: 2000 },
      { intensity: 'rest', effort: 0.62, distance: 400 },
      { intensity: 'active', effort: 0.97, distance: 2000 },
      { intensity: 'rest', effort: 0.62, distance: 400 },
      { intensity: 'active', effort: 0.97, distance: 2000 },
      { intensity: 'cooldown', effort: 0.76, distance: 1500 },
    ],
  },
  treadmillEasy: {
    name: 'Treadmill easy',
    sport: 'running',
    subSport: 'treadmill',
    steps: timed({ effort: 0.84, duration: 2700 }),
  },
  treadmillShort: {
    name: 'Treadmill easy',
    sport: 'running',
    subSport: 'treadmill',
    steps: timed({ effort: 0.82, duration: 1800 }),
  },
  indoorEndurance: {
    name: 'Indoor endurance ride',
    sport: 'cycling',
    subSport: 'indoor_cycling',
    steps: timed({ effort: 0.64, duration: 3600 }),
  },
  indoorSweetSpot: {
    name: 'Sweet spot 3×12 min',
    sport: 'cycling',
    subSport: 'indoor_cycling',
    steps: [
      { intensity: 'warmup', effort: 0.58, duration: 600 },
      { intensity: 'active', effort: 0.92, duration: 720 },
      { intensity: 'rest', effort: 0.5, duration: 240 },
      { intensity: 'active', effort: 0.92, duration: 720 },
      { intensity: 'rest', effort: 0.5, duration: 240 },
      { intensity: 'active', effort: 0.92, duration: 720 },
      { intensity: 'cooldown', effort: 0.5, duration: 600 },
    ],
  },
  garchingRide: {
    name: 'Garching loop',
    sport: 'cycling',
    route: 'north-garching',
    steps: steady(0.66),
  },
  gruenwaldRide: {
    name: 'Grünwald loop',
    sport: 'cycling',
    route: 'south-gruenwald',
    steps: steady(0.68),
  },
  dachauRide: { name: 'Dachau loop', sport: 'cycling', route: 'west-dachau', steps: steady(0.64) },
  marktSchwabenRide: {
    name: 'Markt Schwaben loop',
    sport: 'cycling',
    route: 'east-markt-schwaben',
    steps: steady(0.67),
  },
  starnbergerLong: {
    name: STARNBERGER_LONG_RIDE,
    sport: 'cycling',
    route: 'starnberger-see',
    steps: steady(0.63),
  },
  wolfratshausenRide: {
    name: 'Isar ride to Wolfratshausen',
    sport: 'cycling',
    route: 'isar-wolfratshausen',
    steps: steady(0.65),
  },
  gardaTenno: {
    name: 'Lago di Tenno climb',
    sport: 'cycling',
    route: 'garda-tenno',
    steps: steady(0.7),
  },
  gardaLoppio: {
    name: 'Passo San Giovanni loop',
    sport: 'cycling',
    route: 'garda-loppio',
    steps: steady(0.72),
  },
  gardaArco: { name: 'Arco and Dro', sport: 'cycling', route: 'garda-arco', steps: steady(0.68) },
  gardaTorbole: {
    name: 'Torbole lakeside run',
    sport: 'running',
    route: 'garda-torbole',
    steps: steady(0.86),
  },
} satisfies Record<string, DemoWorkout>;

export type DemoWorkoutKey = keyof typeof DEMO_WORKOUTS;

// --- Weekly templates per training block ---

const BASE_A: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'flaucherEasy' },
  { weekday: 3, start: '06:45', workout: 'treadmillEasy' },
  { weekday: 5, start: '10:00', workout: 'indoorEndurance' },
  { weekday: 6, start: '09:30', workout: 'olympiaparkLong' },
];

const BASE_B: DemoScheduleEntry[] = [
  { weekday: 0, start: '18:15', workout: 'westparkEasy' },
  { weekday: 2, start: '18:30', workout: 'indoorEndurance' },
  { weekday: 4, start: '06:45', workout: 'treadmillShort' },
  { weekday: 6, start: '09:30', workout: 'englischerGarten' },
];

const BUILD1_A: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'isar800s' },
  { weekday: 2, start: '18:00', workout: 'indoorSweetSpot' },
  { weekday: 3, start: '18:30', workout: 'flaucherEasy' },
  { weekday: 5, start: '09:00', workout: 'gruenwaldRide' },
  { weekday: 6, start: '09:30', workout: 'olympiaparkLong' },
];

const BUILD1_B: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'isar1ks' },
  { weekday: 2, start: '06:45', workout: 'treadmillEasy' },
  { weekday: 3, start: '18:00', workout: 'indoorSweetSpot' },
  { weekday: 5, start: '09:00', workout: 'garchingRide' },
  { weekday: 6, start: '09:30', workout: 'isarLong' },
];

const BUILD1_C: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'tempo2ks' },
  { weekday: 3, start: '18:30', workout: 'isarSouthEasy' },
  { weekday: 4, start: '18:00', workout: 'indoorEndurance' },
  { weekday: 5, start: '08:30', workout: 'starnbergerLong' },
  { weekday: 6, start: '10:00', workout: 'flaucherEasy' },
];

const BREAK: DemoScheduleEntry[] = [{ weekday: 5, start: '10:30', workout: 'isarNorthRecovery' }];

const GARDA: DemoScheduleEntry[] = [
  { weekday: 2, start: '10:00', workout: 'gardaTenno', trip: 'garda' },
  { weekday: 3, start: '08:00', workout: 'gardaTorbole', trip: 'garda' },
  { weekday: 4, start: '09:30', workout: 'gardaLoppio', trip: 'garda' },
  { weekday: 6, start: '09:00', workout: 'gardaArco', trip: 'garda' },
];

const BUILD2_A: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'isar800s' },
  { weekday: 2, start: '18:15', workout: 'marktSchwabenRide' },
  { weekday: 3, start: '18:30', workout: 'flaucherEasy' },
  { weekday: 5, start: '08:30', workout: 'wolfratshausenRide' },
  { weekday: 6, start: '09:30', workout: 'isarLong' },
];

const BUILD2_B: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'tempo2ks' },
  { weekday: 2, start: '18:00', workout: 'indoorSweetSpot' },
  { weekday: 3, start: '06:45', workout: 'treadmillEasy' },
  { weekday: 4, start: '18:30', workout: 'theresienwieseShakeout' },
  { weekday: 5, start: '08:30', workout: 'starnbergerLong' },
  { weekday: 6, start: '09:30', workout: 'englischerGarten' },
];

const BUILD2_C: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'isar1ks' },
  { weekday: 3, start: '18:30', workout: 'westparkEasy' },
  { weekday: 4, start: '18:00', workout: 'dachauRide' },
  { weekday: 6, start: '09:30', workout: 'olympiaparkLong' },
];

// The one ride where the chest strap stayed at home.
const BUILD2_C_NO_STRAP: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'isar1ks' },
  { weekday: 3, start: '18:30', workout: 'westparkEasy' },
  { weekday: 4, start: '18:00', workout: 'dachauRide', noHr: true },
  { weekday: 6, start: '09:30', workout: 'olympiaparkLong' },
];

const TAPER_A: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'isar1ks' },
  { weekday: 3, start: '18:30', workout: 'flaucherEasy' },
  { weekday: 5, start: '10:00', workout: 'indoorEndurance' },
  { weekday: 6, start: '09:30', workout: 'englischerGarten' },
];

const TAPER_RACE: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'tempo2ks' },
  { weekday: 3, start: '18:30', workout: 'isarNorthRecovery' },
  { weekday: 5, start: '09:00', workout: 'theresienwieseShakeout' },
  { weekday: 6, start: '09:00', workout: 'halfMarathon' },
];

const RECOVERY: DemoScheduleEntry[] = [
  { weekday: 2, start: '18:30', workout: 'isarNorthRecovery' },
  { weekday: 5, start: '10:00', workout: 'gruenwaldRide' },
];

const MAINTAIN: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'westparkEasy' },
  { weekday: 3, start: '18:00', workout: 'indoorEndurance' },
  { weekday: 5, start: '09:00', workout: 'garchingRide' },
  { weekday: 6, start: '09:30', workout: 'englischerGarten' },
];

const REBUILD_A: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'isar800s' },
  { weekday: 2, start: '18:00', workout: 'indoorSweetSpot' },
  { weekday: 3, start: '18:30', workout: 'flaucherEasy' },
  { weekday: 5, start: '08:30', workout: 'starnbergerLong' },
  { weekday: 6, start: '09:30', workout: 'olympiaparkLong' },
];

const REBUILD_B: DemoScheduleEntry[] = [
  { weekday: 1, start: '18:30', workout: 'tempo2ks' },
  { weekday: 2, start: '18:15', workout: 'gruenwaldRide' },
  { weekday: 3, start: '18:30', workout: 'flaucherEasy' },
  { weekday: 4, start: '06:45', workout: 'treadmillShort' },
  { weekday: 5, start: '08:30', workout: 'wolfratshausenRide' },
  { weekday: 6, start: '09:30', workout: 'isarLong' },
];

// weeksBeforeEnd 51 … 0, oldest first.
export const DEMO_WEEKS: DemoWeek[] = [
  // Base (12 weeks)
  { weeksBeforeEnd: 51, entries: BASE_A },
  { weeksBeforeEnd: 50, entries: BASE_B },
  { weeksBeforeEnd: 49, entries: BASE_A },
  { weeksBeforeEnd: 48, entries: BASE_B },
  { weeksBeforeEnd: 47, entries: BASE_A },
  { weeksBeforeEnd: 46, entries: BASE_B },
  { weeksBeforeEnd: 45, entries: BASE_A },
  { weeksBeforeEnd: 44, entries: BASE_B },
  { weeksBeforeEnd: 43, entries: BASE_A },
  { weeksBeforeEnd: 42, entries: BASE_B },
  { weeksBeforeEnd: 41, entries: BASE_A },
  { weeksBeforeEnd: 40, entries: BASE_B },
  // Build 1 (12 weeks)
  { weeksBeforeEnd: 39, entries: BUILD1_A },
  { weeksBeforeEnd: 38, entries: BUILD1_B },
  { weeksBeforeEnd: 37, entries: BUILD1_C },
  { weeksBeforeEnd: 36, entries: BUILD1_A },
  { weeksBeforeEnd: 35, entries: BUILD1_B },
  { weeksBeforeEnd: 34, entries: BUILD1_C },
  { weeksBeforeEnd: 33, entries: BUILD1_A },
  { weeksBeforeEnd: 32, entries: BUILD1_B },
  { weeksBeforeEnd: 31, entries: BUILD1_C },
  { weeksBeforeEnd: 30, entries: BUILD1_A },
  { weeksBeforeEnd: 29, entries: BUILD1_B },
  { weeksBeforeEnd: 28, entries: BUILD1_C },
  // Break (2 weeks)
  { weeksBeforeEnd: 27, entries: [] },
  { weeksBeforeEnd: 26, entries: BREAK },
  // Lake Garda trip
  { weeksBeforeEnd: 25, entries: GARDA },
  // Build 2 (10 weeks)
  { weeksBeforeEnd: 24, entries: BUILD2_A },
  { weeksBeforeEnd: 23, entries: BUILD2_B },
  { weeksBeforeEnd: 22, entries: BUILD2_C },
  { weeksBeforeEnd: 21, entries: BUILD2_A },
  { weeksBeforeEnd: 20, entries: BUILD2_B },
  { weeksBeforeEnd: 19, entries: BUILD2_C_NO_STRAP },
  { weeksBeforeEnd: 18, entries: BUILD2_A },
  { weeksBeforeEnd: 17, entries: BUILD2_B },
  { weeksBeforeEnd: 16, entries: BUILD2_C },
  { weeksBeforeEnd: 15, entries: BUILD2_A },
  // Taper into the half marathon, then a recovery week
  { weeksBeforeEnd: 14, entries: TAPER_A },
  { weeksBeforeEnd: 13, entries: TAPER_RACE },
  { weeksBeforeEnd: 12, entries: RECOVERY },
  // Maintenance (4 weeks)
  { weeksBeforeEnd: 11, entries: MAINTAIN },
  { weeksBeforeEnd: 10, entries: MAINTAIN },
  { weeksBeforeEnd: 9, entries: MAINTAIN },
  { weeksBeforeEnd: 8, entries: MAINTAIN },
  // Rebuild (8 weeks), so "today" shows rising CTL
  { weeksBeforeEnd: 7, entries: REBUILD_B },
  { weeksBeforeEnd: 6, entries: REBUILD_A },
  { weeksBeforeEnd: 5, entries: REBUILD_B },
  { weeksBeforeEnd: 4, entries: REBUILD_A },
  { weeksBeforeEnd: 3, entries: REBUILD_B },
  { weeksBeforeEnd: 2, entries: REBUILD_A },
  { weeksBeforeEnd: 1, entries: REBUILD_B },
  { weeksBeforeEnd: 0, entries: REBUILD_A },
];
