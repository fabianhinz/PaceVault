import { m } from '@pacevault/i18n/messages.js';
import type {
  DailyMetrics,
  FormStatus,
  RunningZone,
  RunningZoneName,
} from '@pacevault/engine/types.ts';
import type {
  PrescribedWorkout,
  WeeklyPlan,
  WorkoutStep,
  WorkoutType,
  PlanContext,
} from '@/types/index.ts';
import { toDateString } from './formatters.ts';
import { getFormStatus, getInjuryRisk, getLoadState } from '@pacevault/engine/coaching.ts';
import { getZoneMidPace } from '@pacevault/engine/zones.ts';

// --- TSS per hour by workout type ---

const TSS_PER_HOUR: Record<Exclude<WorkoutType, 'rest'>, number> = {
  recovery: 30,
  easy: 50,
  'long-run': 55,
  tempo: 65,
  'threshold-intervals': 75,
  'vo2max-intervals': 85,
};

// --- Workout template builders ---

const DAY_NAMES = [
  m.coach_day_monday,
  m.coach_day_tuesday,
  m.coach_day_wednesday,
  m.coach_day_thursday,
  m.coach_day_friday,
  m.coach_day_saturday,
  m.coach_day_sunday,
];

const zoneRange = (
  zoneName: RunningZoneName,
  zones: RunningZone[],
): { min: number; max: number } => {
  const zone = zones.find((z) => z.name === zoneName);
  if (!zone) return { min: 0, max: 0 };
  return { min: zone.minPace, max: zone.maxPace };
};

const step = (
  type: WorkoutStep['type'],
  durationSec: number,
  zoneName: RunningZoneName,
  zones: RunningZone[],
  repeat?: number,
): WorkoutStep => {
  const range = zoneRange(zoneName, zones);
  let spreadRepeat: { repeat: number } | Record<string, never> = {};
  if (repeat !== undefined) {
    spreadRepeat = { repeat };
  }
  return {
    type,
    durationSec,
    zone: zoneName,
    targetPaceMin: range.min,
    targetPaceMax: range.max,
    ...spreadRepeat,
  };
};

const buildWorkout = (
  type: WorkoutType,
  zones: RunningZone[],
): { title: string; steps: WorkoutStep[] } => {
  switch (type) {
    case 'rest':
      return { title: m.coach_workout_rest(), steps: [] };
    case 'recovery':
      return {
        title: m.coach_workout_recovery(),
        steps: [step('work', 25 * 60, 'recovery', zones)],
      };
    case 'easy':
      return {
        title: m.coach_workout_easy(),
        steps: [step('work', 45 * 60, 'easy', zones)],
      };
    case 'long-run':
      return {
        title: m.coach_workout_long_run(),
        steps: [step('work', 75 * 60, 'easy', zones), step('work', 15 * 60, 'tempo', zones)],
      };
    case 'tempo':
      return {
        title: m.coach_workout_tempo(),
        steps: [
          step('warmup', 10 * 60, 'easy', zones),
          step('work', 25 * 60, 'tempo', zones),
          step('cooldown', 10 * 60, 'easy', zones),
        ],
      };
    case 'threshold-intervals':
      return {
        title: m.coach_workout_threshold(),
        steps: [
          step('warmup', 10 * 60, 'easy', zones),
          step('work', 5 * 60, 'threshold', zones, 5),
          step('recovery', 2 * 60, 'recovery', zones, 5),
          step('cooldown', 10 * 60, 'easy', zones),
        ],
      };
    case 'vo2max-intervals':
      return {
        title: m.coach_workout_vo2max(),
        steps: [
          step('warmup', 15 * 60, 'easy', zones),
          step('work', 3 * 60, 'vo2max', zones, 5),
          step('recovery', 3 * 60, 'recovery', zones, 5),
          step('cooldown', 10 * 60, 'easy', zones),
        ],
      };
  }
};

// --- TSS & distance estimation ---

export const estimateWorkoutTss = (workout: PrescribedWorkout): number => {
  if (workout.type === 'rest') return 0;
  const tssRate = TSS_PER_HOUR[workout.type];
  return Math.round((workout.estimatedDurationSec / 3600) * tssRate);
};

const computeStepsDuration = (steps: WorkoutStep[]): number => {
  return steps.reduce((total, s) => total + s.durationSec * (s.repeat ?? 1), 0);
};

export const estimateWorkoutDistance = (
  workout: PrescribedWorkout,
  zones: RunningZone[],
): number => {
  if (workout.type === 'rest') return 0;
  let meters = 0;
  for (const s of workout.steps) {
    const zone = zones.find((z) => z.name === s.zone);
    if (!zone) continue;
    const midPace = getZoneMidPace(zone); // sec/km
    const reps = s.repeat ?? 1;
    meters += ((s.durationSec * reps) / midPace) * 1000;
  }
  return Math.round(meters);
};

// --- Week template selection ---

type WeekTemplate = WorkoutType[];

const WEEK_TEMPLATES: Record<FormStatus | 'no-data', WeekTemplate> = {
  overload: ['rest', 'recovery', 'rest', 'recovery', 'rest', 'easy', 'easy'],
  optimal: [
    'easy',
    'threshold-intervals',
    'recovery',
    'vo2max-intervals',
    'tempo',
    'rest',
    'long-run',
  ],
  neutral: ['easy', 'threshold-intervals', 'recovery', 'tempo', 'easy', 'rest', 'long-run'],
  fresh: [
    'easy',
    'vo2max-intervals',
    'recovery',
    'threshold-intervals',
    'tempo',
    'rest',
    'long-run',
  ],
  detraining: [
    'easy',
    'vo2max-intervals',
    'recovery',
    'threshold-intervals',
    'tempo',
    'easy',
    'long-run',
  ],
  'no-data': ['rest', 'easy', 'rest', 'easy', 'easy', 'easy', 'easy'],
};

const getRationale = (context: PlanContext): string => {
  if (context.mode === 'no-data') {
    return m.coach_rationale_no_data();
  }
  if (context.mode === 'taper') {
    return m.coach_rationale_taper({
      raceDate: context.raceDate,
      daysToRace: String(context.daysToRace),
    });
  }
  const risk = getInjuryRisk(context.acwr);
  let tsbSign = '';
  if (context.tsb > 0) {
    tsbSign = '+';
  }
  const tsb = `${tsbSign}${Math.round(context.tsb)}`;
  const base = m.coach_rationale_base({
    tsb,
    formStatus: context.formStatus,
    acwr: context.acwr.toFixed(2),
    risk,
  });
  if (context.dataMaturityDays < 28) {
    return m.coach_rationale_immature({ base, days: String(context.dataMaturityDays) });
  }
  return base;
};

// --- Load guards ---

const HIGH_INTENSITY: Set<WorkoutType> = new Set(['vo2max-intervals', 'threshold-intervals']);

const downgradeToRecoveryWeek = (template: WeekTemplate): WeekTemplate =>
  template.map((t) => {
    if (HIGH_INTENSITY.has(t)) return 'rest';
    if (t === 'tempo' || t === 'long-run') return 'easy';
    return t;
  });

const downgradeModerately = (template: WeekTemplate): WeekTemplate =>
  template.map((t) => {
    if (HIGH_INTENSITY.has(t) || t === 'long-run') return 'easy';
    return t;
  });

const upgradeForUndertraining = (template: WeekTemplate): WeekTemplate => {
  const result = [...template];
  // Upgrade first rest day (not Saturday index 5) to easy
  const restIndex = result.findIndex((t, i) => t === 'rest' && i !== 5);
  if (restIndex !== -1) {
    result[restIndex] = 'easy';
    return result;
  }
  // Fallback: upgrade first recovery to easy
  const recoveryIndex = result.findIndex((t) => t === 'recovery');
  if (recoveryIndex !== -1) {
    result[recoveryIndex] = 'easy';
  }
  return result;
};

const applyLoadGuards = (
  template: WeekTemplate,
  acwr: number,
  dataMaturityDays: number,
): WeekTemplate => {
  const state = getLoadState(acwr, dataMaturityDays);
  switch (state) {
    case 'immature':
    case 'transitioning':
      return WEEK_TEMPLATES['no-data'];
    case 'high-risk':
      return downgradeToRecoveryWeek(template);
    case 'moderate-risk':
      return downgradeModerately(template);
    case 'undertraining':
      return upgradeForUndertraining(template);
    case 'sweet-spot':
      return [...template];
  }
};

// --- Hard/easy validation ---

const INTENSITY_TYPES = new Set<WorkoutType>([
  'threshold-intervals',
  'vo2max-intervals',
  'tempo',
  'long-run',
]);

const fixBackToBackIntensity = (template: WeekTemplate): WeekTemplate => {
  const result = [...template];
  for (let i = 1; i < result.length; i++) {
    const current = result[i];
    const previous = result[i - 1];
    if (current && previous && INTENSITY_TYPES.has(current) && INTENSITY_TYPES.has(previous)) {
      result[i] = 'easy';
    }
  }
  return result;
};

// --- Main entry point ---

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toDateString(d.getTime());
};

const getDayOfWeek = (dateStr: string): number => {
  const d = new Date(dateStr + 'T00:00:00');
  // Convert JS day (0=Sun) to Mon-based (0=Mon)
  return (d.getDay() + 6) % 7;
};

export const generateWeeklyPlan = (
  currentMetrics: DailyMetrics | undefined,
  zones: RunningZone[],
  today: string,
  historyDays: number,
): WeeklyPlan => {
  // Determine context
  let context: PlanContext = { mode: 'no-data' };
  if (currentMetrics) {
    context = {
      mode: 'normal',
      formStatus: getFormStatus(currentMetrics.tsb),
      tsb: currentMetrics.tsb,
      acwr: currentMetrics.acwr,
      dataMaturityDays: historyDays,
    };
  }

  let formKey: FormStatus | 'no-data' = 'no-data';
  if (context.mode === 'normal') {
    formKey = context.formStatus;
  }

  // Get base template and apply guards
  let template = WEEK_TEMPLATES[formKey];

  if (context.mode === 'normal') {
    template = applyLoadGuards(template, context.acwr, context.dataMaturityDays);
    template = fixBackToBackIntensity(template);
  }

  // Calculate Monday of current week
  const dayOfWeek = getDayOfWeek(today);
  const monday = addDays(today, -dayOfWeek);

  // Build workouts
  const workouts: PrescribedWorkout[] = template.map((type, i) => {
    const date = addDays(monday, i);
    const built = buildWorkout(type, zones);
    const durationSec = computeStepsDuration(built.steps);
    let tssRate = 0;
    if (type !== 'rest') {
      tssRate = TSS_PER_HOUR[type];
    }
    const estimatedTss = Math.round((durationSec / 3600) * tssRate);

    return {
      id: `plan-${date}`,
      date,
      dayLabel: (DAY_NAMES[i] ?? m.coach_day_monday)(),
      type,
      title: built.title,
      steps: built.steps,
      estimatedDurationSec: durationSec,
      estimatedTss,
      rationale: getRationale(context),
      isTaper: false,
    };
  });

  return {
    weekOf: monday,
    workouts,
    totalEstimatedTss: workouts.reduce((sum, w) => sum + w.estimatedTss, 0),
    context,
  };
};
