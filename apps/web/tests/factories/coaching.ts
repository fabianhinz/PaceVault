import type { CoachingRecommendation, WeeklyPlan, WorkoutStep } from '@/types.ts';

export const createMockCoachingRecommendation = (
  overrides?: Partial<CoachingRecommendation>,
): CoachingRecommendation => ({
  status: 'neutral',
  message: '',
  tsb: 0,
  acwr: 1.0,
  injuryRisk: 'low',
  dataMaturityDays: 42,
  ...overrides,
});

export const createMockWorkoutStep = (overrides?: Partial<WorkoutStep>): WorkoutStep => ({
  type: 'work',
  durationSec: 300,
  zone: 'tempo',
  targetPaceMin: 270,
  targetPaceMax: 290,
  ...overrides,
});

export const createMockWeeklyPlan = (overrides?: Partial<WeeklyPlan>): WeeklyPlan => ({
  weekOf: '2026-02-09',
  workouts: [],
  totalEstimatedTss: 0,
  context: { mode: 'no-data' },
  ...overrides,
});
