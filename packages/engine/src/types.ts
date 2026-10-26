export const SPORTS = ['running', 'cycling'] as const;
export type Sport = (typeof SPORTS)[number];
export type Gender = 'male' | 'female';

export type FormStatus = 'detraining' | 'fresh' | 'neutral' | 'optimal' | 'overload';

export type InjuryRisk = 'low' | 'moderate' | 'high';

export type LoadState =
  | 'immature'
  | 'transitioning'
  | 'high-risk'
  | 'moderate-risk'
  | 'undertraining'
  | 'sweet-spot';

export type RunningZoneName = 'recovery' | 'easy' | 'tempo' | 'threshold' | 'vo2max';

export const RACE_DISTANCES = ['5k', '10k', 'half-marathon', 'marathon'] as const;
export type RaceDistance = (typeof RACE_DISTANCES)[number];

export type PBCategory = 'peak-power' | 'fastest-distance' | 'longest' | 'most-elevation';

export type SessionSource =
  | { kind: 'file' }
  | { kind: 'intervals'; activityId: string }
  | { kind: 'demo' };

export interface TrainingSession {
  id: string;
  name?: string;
  sport: Sport;
  date: number;
  duration: number;
  distance?: number;
  avgHr?: number;
  maxHr?: number;
  avgPower?: number;
  normalizedPower?: number;
  avgCadence?: number;
  avgPace?: number;
  elevationGain?: number;
  elevationLoss?: number;
  subSport?: string;
  avgSpeed?: number;
  maxSpeed?: number;
  gap?: number;
  tss: number;
  stressMethod: 'tss' | 'trimp' | 'duration';
  isPlanned: boolean;
  hasDetailedRecords: boolean;
  fingerprint?: string;
  derivationVersion: number;
  createdAt: number;
  isNew?: boolean;
  source: SessionSource;
}

export type SessionFields = Omit<TrainingSession, 'id' | 'createdAt' | 'isNew' | 'source'>;

export interface SessionRecord {
  timestamp: number;
  hr?: number;
  power?: number;
  cadence?: number;
  speed?: number;
  lat?: number;
  lng?: number;
  elevation?: number;
  distance?: number;
  timerTime?: number;
}

export interface SessionLap {
  lapIndex: number;
  startTime: number;
  endTime: number;
  totalTimerTime: number;
  totalMovingTime?: number;
  distance?: number;
  minHr?: number;
  maxHr?: number;
  intensity?: string;
}

export interface DailyMetrics {
  date: string;
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
  acwr: number;
}

export interface RunningZone {
  name: RunningZoneName;
  slowestPaceSecPerKm: number;
  fastestPaceSecPerKm: number;
}

export interface PersonalBest {
  sport: Sport;
  category: PBCategory;
  window: number;
  value: number;
  sessionId: string;
  date: number;
}

export interface GPSPoint {
  lat: number;
  lng: number;
}

export interface GPSBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface SessionGPS {
  sessionId: string;
  encodedPolyline: string;
  pointCount: number;
  bounds: GPSBounds;
}

export interface DatedValue<T> {
  date: number;
  value: T;
}

export interface StressThresholds {
  restHr: number;
  maxHr: number;
  gender: Gender;
  ftp?: number;
  thresholdHr?: number;
}
