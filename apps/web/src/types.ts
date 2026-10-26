import type {
  DatedValue,
  GPSBounds,
  Sport,
  Gender,
  FormStatus,
  InjuryRisk,
  RunningZoneName,
  RaceDistance,
  PersonalBest,
  SessionGPS,
  SessionLap,
  SessionRecord,
} from '@pacevault/engine/types.ts';
import type { RoutePoint } from '@pacevault/gpx/types.ts';
import type { RouteElevationStats } from '@pacevault/gpx/routeGeometry.ts';

export type ThresholdKey = 'restHr' | 'maxHr' | 'thresholdHr' | 'ftp' | 'thresholdPace' | 'weight';

export interface UserProfile {
  id: string;
  gender: Gender;
  thresholds: {
    restHr: DatedValue<number>[];
    maxHr: DatedValue<number>[];
    ftp?: DatedValue<number>[];
    thresholdPace?: DatedValue<number>[];
    thresholdHr?: DatedValue<number>[];
  };
  weight?: DatedValue<number>[];
  birthYear?: number;
  showMetricHelp: boolean;
  createdAt: number;
}

export interface CoachingRecommendation {
  status: FormStatus;
  message: string;
  tsb: number;
  acwr: number;
  injuryRisk: InjuryRisk;
  dataMaturityDays: number;
}

export type WorkoutType =
  | 'rest'
  | 'recovery'
  | 'easy'
  | 'long-run'
  | 'tempo'
  | 'threshold-intervals'
  | 'vo2max-intervals';

type StepType = 'warmup' | 'work' | 'recovery' | 'cooldown';

export interface WorkoutStep {
  type: StepType;
  durationSec: number;
  zone: RunningZoneName;
  targetPaceMin: number;
  targetPaceMax: number;
  repeat?: number;
}

export interface PrescribedWorkout {
  id: string;
  date: string;
  dayLabel: string;
  type: WorkoutType;
  title: string;
  steps: WorkoutStep[];
  estimatedDurationSec: number;
  estimatedTss: number;
  rationale: string;
  isTaper: boolean;
}

export type PlanContext =
  | { mode: 'normal'; formStatus: FormStatus; tsb: number; acwr: number; dataMaturityDays: number }
  | { mode: 'taper'; raceDate: string; raceDistance: RaceDistance; daysToRace: number }
  | { mode: 'no-data' };

export interface WeeklyPlan {
  weekOf: string;
  workouts: PrescribedWorkout[];
  totalEstimatedTss: number;
  context: PlanContext;
}

export type StorageCategory = 'heatmap' | 'fitFiles' | 'weather' | 'appData';

export interface StorageBreakdown {
  total: number | null;
  categories: Record<StorageCategory, number> | null;
}

export interface PreviewPass {
  sport: Sport;
  /** [lng, lat] pairs. */
  path: [number, number][];
  /** Cumulative distance in metres at each point. */
  cumulative: number[];
  length: number;
  /** Delay in ms after the reveal before this pass starts drawing. */
  start: number;
  duration: number;
}

export interface PreviewPasses {
  passes: PreviewPass[];
  bounds: GPSBounds | null;
}

export interface WeatherSnapshot {
  time: number;
  lat: number;
  lng: number;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGusts: number;
  windDirection: number;
  weatherCode: number;
}

export interface SessionWeather {
  sessionId: string;
  snapshots: WeatherSnapshot[];
  fetchedAt: number;
}

export interface IntervalsSyncSummary {
  available: number;
  pending: number;
  imported: number;
  duplicated: number;
  failed: number;
}

export interface QueryResults {
  onboardingPreviewRoutes: PreviewPasses;
  sessionWeather: SessionWeather | null;
  personalBests: PersonalBest[];
  intervalsKeyCheck: true;
  intervalsSync: IntervalsSyncSummary;
  studioRoutePoints: RoutePoint[];
  sessionRecords: SessionRecord[];
  sessionLaps: SessionLap[];
  sessionGps: SessionGPS | null;
  sessionGpsTracks: SessionGPS[];
  storageBreakdown: StorageBreakdown;
  outdatedSessionsReprocessing: number;
  trainingLoadRecompute: true;
}

export type StudioRouteColor = 'amber' | 'orange' | 'rose' | 'fuchsia' | 'violet' | 'emerald';

export type StudioMarkerType = 'track_modifier' | 'point_of_interest';

export interface StudioMarkerBase {
  id: string;
  distanceM: number;
}

export interface TrackModifierMarker extends StudioMarkerBase {
  type: 'track_modifier';
}

export interface PointOfInterestMarker extends StudioMarkerBase {
  type: 'point_of_interest';
  label: string;
  description?: string;
}

export type StudioMarker = TrackModifierMarker | PointOfInterestMarker;

export interface StudioRoute {
  id: string;
  name: string;
  sourceFileName: string;
  importedAt: number;
  color: StudioRouteColor;
  encodedPolylines: string[];
  bounds: GPSBounds;
  distance: number;
  elevation?: RouteElevationStats;
  markers: StudioMarker[];
}
