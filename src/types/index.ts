import type {
  Gender,
  FormStatus,
  InjuryRisk,
  RunningZoneName,
  RaceDistance,
} from '@/packages/engine/types.ts';

export type {
  Gender,
  FormStatus,
  InjuryRisk,
  RunningZoneName,
  RaceDistance,
} from '@/packages/engine/types.ts';

export interface UserProfile {
  id: string;
  gender: Gender;
  thresholds: {
    ftp?: number;
    maxHr: number;
    restHr: number;
    thresholdPace?: number; // sec/km
  };
  showMetricHelp: boolean;
  useAutoSessionNames: boolean;
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

// --- Running Zones & Coaching Plan ---

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
  targetPaceMin: number; // sec/km
  targetPaceMax: number; // sec/km
  repeat?: number;
}

export interface PrescribedWorkout {
  id: string;
  date: string; // YYYY-MM-DD
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
