// ---------------------------------------------------------------------------
// Engine-owned types — all pure data definitions used by engine functions
// ---------------------------------------------------------------------------

export type Sport = 'running' | 'cycling';
export type Gender = 'male' | 'female' | 'other';

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

export type RaceDistance = '5k' | '10k' | 'half-marathon' | 'marathon';

export type PBCategory = 'peak-power' | 'fastest-distance' | 'longest' | 'most-elevation';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface TrainingSession {
  id: string;
  name?: string;
  sport: Sport;
  date: number;
  duration: number;
  distance: number;
  avgHr?: number;
  maxHr?: number;
  avgPower?: number;
  maxPower?: number;
  normalizedPower?: number;
  avgCadence?: number;
  avgPace?: number;
  calories?: number;
  elevationGain?: number;
  elevationLoss?: number;
  movingTime?: number;
  subSport?: string;
  deviceTss?: number;
  deviceIf?: number;
  deviceFtp?: number;
  avgSpeed?: number;
  maxSpeed?: number;
  minAltitude?: number;
  maxAltitude?: number;
  avgAltitude?: number;
  gap?: number;
  tss: number;
  stressMethod: 'tss' | 'trimp' | 'duration';
  sensorWarnings: string[];
  isPlanned: boolean;
  hasDetailedRecords: boolean;
  fingerprint?: string;
  createdAt: number;
}

export interface SessionRecord {
  sessionId: string;
  timestamp: number;
  hr?: number;
  power?: number;
  cadence?: number;
  speed?: number;
  lat?: number;
  lng?: number;
  elevation?: number;
  distance?: number;
  grade?: number;
  timerTime?: number;
}

export interface SessionLap {
  sessionId: string;
  lapIndex: number;
  startTime: number;
  endTime: number;
  totalElapsedTime: number;
  totalTimerTime: number;
  totalMovingTime?: number;
  distance: number;
  avgSpeed: number;
  maxSpeed?: number;
  totalAscent?: number;
  minAltitude?: number;
  maxAltitude?: number;
  avgAltitude?: number;
  avgGrade?: number;
  avgHr?: number;
  minHr?: number;
  maxHr?: number;
  avgCadence?: number;
  maxCadence?: number;
  intensity?: string;
  repetitionNum?: number;
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
  label: string;
  minPace: number; // sec/km (slower = higher number)
  maxPace: number; // sec/km (faster = lower number)
  color: string;
}

export interface PersonalBest {
  sport: Sport;
  category: PBCategory;
  window: number;
  value: number;
  sessionId: string;
  date: number;
}

// ---------------------------------------------------------------------------
// GPS types
// ---------------------------------------------------------------------------

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
