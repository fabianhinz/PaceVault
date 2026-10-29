import { m } from '@pacevault/i18n/messages.js';
import type {
  DailyMetrics,
  FormStatus,
  RunningZone,
  RunningZoneName,
  TrainingSession,
} from '@pacevault/engine/types.ts';
import type {
  PrescribedWorkout,
  WeeklyPlan,
  WorkoutStep,
  WorkoutType,
  PlanContext,
} from '@/types.ts';
import { formatNumber, toDateString } from '@/lib/format/formatters.ts';
import {
  formStatusFromTsb,
  injuryRiskFromAcwr,
  loadStateFromAcwr,
} from '@pacevault/engine/coaching.ts';
import { zoneMidPace } from '@pacevault/engine/zones.ts';
import { dailyMetricsFromSessions } from '@pacevault/engine/metrics.ts';

// --- TSS per hour by workout type ---

const TSS_PER_HOUR_BY_WORKOUT_TYPE: Record<Exclude<WorkoutType, 'rest'>, number> = {
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

const zoneRange = ({
  zoneName,
  zones,
}: {
  zoneName: RunningZoneName;
  zones: RunningZone[];
}): { min: number; max: number } => {
  const zone = zones.find((z) => z.name === zoneName);
  if (!zone) return { min: 0, max: 0 };
  return { min: zone.slowestPaceSecPerKm, max: zone.fastestPaceSecPerKm };
};

const step = ({
  type,
  durationSec,
  zoneName,
  zones,
  repeat,
}: {
  type: WorkoutStep['type'];
  durationSec: number;
  zoneName: RunningZoneName;
  zones: RunningZone[];
  repeat?: number;
}): WorkoutStep => {
  const range = zoneRange({ zoneName, zones });
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

const buildWorkout = ({
  type,
  zones,
}: {
  type: WorkoutType;
  zones: RunningZone[];
}): { title: string; steps: WorkoutStep[] } => {
  switch (type) {
    case 'rest':
      return { title: m.coach_workout_rest(), steps: [] };
    case 'recovery':
      return {
        title: m.coach_workout_recovery(),
        steps: [step({ type: 'work', durationSec: 25 * 60, zoneName: 'recovery', zones })],
      };
    case 'easy':
      return {
        title: m.coach_workout_easy(),
        steps: [step({ type: 'work', durationSec: 45 * 60, zoneName: 'easy', zones })],
      };
    case 'long-run':
      return {
        title: m.coach_workout_long_run(),
        steps: [
          step({ type: 'work', durationSec: 75 * 60, zoneName: 'easy', zones }),
          step({ type: 'work', durationSec: 15 * 60, zoneName: 'tempo', zones }),
        ],
      };
    case 'tempo':
      return {
        title: m.coach_workout_tempo(),
        steps: [
          step({ type: 'warmup', durationSec: 10 * 60, zoneName: 'easy', zones }),
          step({ type: 'work', durationSec: 25 * 60, zoneName: 'tempo', zones }),
          step({ type: 'cooldown', durationSec: 10 * 60, zoneName: 'easy', zones }),
        ],
      };
    case 'threshold-intervals':
      return {
        title: m.coach_workout_threshold(),
        steps: [
          step({ type: 'warmup', durationSec: 10 * 60, zoneName: 'easy', zones }),
          step({ type: 'work', durationSec: 5 * 60, zoneName: 'threshold', zones, repeat: 5 }),
          step({ type: 'recovery', durationSec: 2 * 60, zoneName: 'recovery', zones, repeat: 5 }),
          step({ type: 'cooldown', durationSec: 10 * 60, zoneName: 'easy', zones }),
        ],
      };
    case 'vo2max-intervals':
      return {
        title: m.coach_workout_vo2max(),
        steps: [
          step({ type: 'warmup', durationSec: 15 * 60, zoneName: 'easy', zones }),
          step({ type: 'work', durationSec: 3 * 60, zoneName: 'vo2max', zones, repeat: 5 }),
          step({ type: 'recovery', durationSec: 3 * 60, zoneName: 'recovery', zones, repeat: 5 }),
          step({ type: 'cooldown', durationSec: 10 * 60, zoneName: 'easy', zones }),
        ],
      };
  }
};

// --- TSS & distance estimation ---

export const estimateWorkoutTss = (workout: PrescribedWorkout): number => {
  if (workout.type === 'rest') return 0;
  const tssRate = TSS_PER_HOUR_BY_WORKOUT_TYPE[workout.type];
  return Math.round((workout.estimatedDurationSec / 3600) * tssRate);
};

const computeStepsDuration = (steps: WorkoutStep[]): number => {
  return steps.reduce((total, s) => total + s.durationSec * (s.repeat ?? 1), 0);
};

export const estimateWorkoutDistance = ({
  workout,
  zones,
}: {
  workout: PrescribedWorkout;
  zones: RunningZone[];
}): number => {
  if (workout.type === 'rest') return 0;
  let meters = 0;
  for (const s of workout.steps) {
    const zone = zones.find((z) => z.name === s.zone);
    if (!zone) continue;
    const midPace = zoneMidPace(zone); // sec/km
    const reps = s.repeat ?? 1;
    meters += ((s.durationSec * reps) / midPace) * 1000;
  }
  return Math.round(meters);
};

// --- Week template selection ---

type WeekTemplate = WorkoutType[];

const WEEK_TEMPLATE_BY_FORM_STATUS: Record<FormStatus | 'no-data', WeekTemplate> = {
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
  const risk = injuryRiskFromAcwr(context.acwr);
  let tsbSign = '';
  if (context.tsb > 0) {
    tsbSign = '+';
  }
  const tsb = `${tsbSign}${Math.round(context.tsb)}`;
  const base = m.coach_rationale_base({
    tsb,
    formStatus: context.formStatus,
    acwr: formatNumber(context.acwr, 'fixed-two-decimals'),
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

const applyLoadGuards = ({
  template,
  acwr,
  dataMaturityDays,
}: {
  template: WeekTemplate;
  acwr: number;
  dataMaturityDays: number;
}): WeekTemplate => {
  const state = loadStateFromAcwr({ acwr, dataMaturityDays });
  switch (state) {
    case 'immature':
    case 'transitioning':
      return WEEK_TEMPLATE_BY_FORM_STATUS['no-data'];
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

export const generateWeeklyPlan = ({
  currentMetrics,
  zones,
  today,
  historyDays,
}: {
  currentMetrics: DailyMetrics | undefined;
  zones: RunningZone[];
  today: string;
  historyDays: number;
}): WeeklyPlan => {
  // Determine context
  let context: PlanContext = { mode: 'no-data' };
  if (currentMetrics) {
    context = {
      mode: 'normal',
      formStatus: formStatusFromTsb(currentMetrics.tsb),
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
  let template = WEEK_TEMPLATE_BY_FORM_STATUS[formKey];

  if (context.mode === 'normal') {
    template = applyLoadGuards({
      template,
      acwr: context.acwr,
      dataMaturityDays: context.dataMaturityDays,
    });
    template = fixBackToBackIntensity(template);
  }

  // Calculate Monday of current week
  const dayOfWeek = getDayOfWeek(today);
  const monday = addDays(today, -dayOfWeek);

  // Build workouts
  const workouts: PrescribedWorkout[] = template.map((type, i) => {
    const date = addDays(monday, i);
    const built = buildWorkout({ type, zones });
    const durationSec = computeStepsDuration(built.steps);
    let tssRate = 0;
    if (type !== 'rest') {
      tssRate = TSS_PER_HOUR_BY_WORKOUT_TYPE[type];
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

export const generateFreshPlan = ({
  sessions,
  zones,
  today,
}: {
  sessions: TrainingSession[];
  zones: RunningZone[];
  today: string;
}): WeeklyPlan => {
  const history = dailyMetricsFromSessions({ sessions });
  let current = undefined;
  if (history.length > 0) {
    current = history[history.length - 1];
  }
  return generateWeeklyPlan({
    currentMetrics: current,
    zones,
    today,
    historyDays: history.length,
  });
};
