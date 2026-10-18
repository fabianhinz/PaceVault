import { describe, it, expect } from 'vite-plus/test';
import {
  generateWeeklyPlan,
  estimateWorkoutTss,
  estimateWorkoutDistance,
} from '@/lib/prescription.ts';
import { computeRunningZones } from '@/packages/engine/zones.ts';
import type { DailyMetrics } from '@/packages/engine/types.ts';
import type { PrescribedWorkout, WorkoutType } from '@/types/index.ts';

const zones = computeRunningZones(270); // 4:30/km threshold
const MATURE = 42; // days — well above 28-day threshold

const makeMetrics = (overrides: Partial<DailyMetrics> = {}): DailyMetrics => ({
  date: '2026-02-20',
  tss: 50,
  ctl: 40,
  atl: 50,
  tsb: -10,
  acwr: 1.0,
  ...overrides,
});

describe('generateWeeklyPlan', () => {
  it('returns 7 workouts', () => {
    const plan = generateWeeklyPlan(makeMetrics(), zones, '2026-02-20', MATURE);
    expect(plan.workouts).toHaveLength(7);
  });

  it('starts on Monday of the current week', () => {
    // 2026-02-20 is a Friday → Monday is 2026-02-16
    const plan = generateWeeklyPlan(makeMetrics(), zones, '2026-02-20', MATURE);
    expect(plan.weekOf).toBe('2026-02-16');
    expect(plan.workouts[0].dayLabel).toBe('Monday');
    expect(plan.workouts[6].dayLabel).toBe('Sunday');
  });

  it('assigns consecutive dates Mon-Sun', () => {
    const plan = generateWeeklyPlan(makeMetrics(), zones, '2026-02-20', MATURE);
    for (let i = 1; i < plan.workouts.length; i++) {
      const prev = new Date(plan.workouts[i - 1].date + 'T00:00:00');
      const curr = new Date(plan.workouts[i].date + 'T00:00:00');
      expect(curr.getTime() - prev.getTime()).toBe(86400000);
    }
  });

  it('has totalEstimatedTss matching sum of individual workouts', () => {
    const plan = generateWeeklyPlan(makeMetrics(), zones, '2026-02-20', MATURE);
    const sum = plan.workouts.reduce((s, w) => s + w.estimatedTss, 0);
    expect(plan.totalEstimatedTss).toBe(sum);
  });

  it('rest workouts have 0 TSS and no steps', () => {
    const plan = generateWeeklyPlan(makeMetrics(), zones, '2026-02-20', MATURE);
    const rests = plan.workouts.filter((w) => w.type === 'rest');
    for (const r of rests) {
      expect(r.estimatedTss).toBe(0);
      expect(r.steps).toHaveLength(0);
    }
  });

  it('all non-rest workouts have steps with pace targets', () => {
    const plan = generateWeeklyPlan(makeMetrics(), zones, '2026-02-20', MATURE);
    const active = plan.workouts.filter((w) => w.type !== 'rest');
    for (const w of active) {
      expect(w.steps.length).toBeGreaterThan(0);
      for (const s of w.steps) {
        expect(s.targetPaceMin).toBeGreaterThan(0);
        expect(s.targetPaceMax).toBeGreaterThan(0);
        expect(s.targetPaceMin).toBeGreaterThanOrEqual(s.targetPaceMax); // min pace is slower
      }
    }
  });
});

describe('form status templates', () => {
  it('overload (TSB < -30) generates mostly rest/recovery', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -35, acwr: 1.0 }),
      zones,
      '2026-02-16',
      MATURE,
    );
    const types = plan.workouts.map((w) => w.type);
    const restCount = types.filter((t) => t === 'rest').length;
    const recoveryCount = types.filter((t) => t === 'recovery').length;
    expect(restCount + recoveryCount).toBeGreaterThanOrEqual(4);
  });

  it('optimal (TSB -10 to -30) includes intensity sessions', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -15, acwr: 1.0 }),
      zones,
      '2026-02-16',
      MATURE,
    );
    const types = plan.workouts.map((w) => w.type);
    expect(types).toContain('threshold-intervals');
    expect(types).toContain('long-run');
  });

  it('detraining (TSB > 25) includes high-intensity sessions', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: 30, acwr: 1.0 }),
      zones,
      '2026-02-16',
      MATURE,
    );
    const types = plan.workouts.map((w) => w.type);
    expect(types).toContain('vo2max-intervals');
    expect(types).toContain('threshold-intervals');
  });

  it('no-data generates conservative plan', () => {
    const plan = generateWeeklyPlan(undefined, zones, '2026-02-16', 0);
    expect(plan.context).toEqual({ mode: 'no-data' });
    const types = plan.workouts.map((w) => w.type);
    const easyCount = types.filter((t) => t === 'easy').length;
    expect(easyCount).toBeGreaterThanOrEqual(4);
  });
});

describe('load guards', () => {
  describe('immature data (<21 days)', () => {
    it('uses conservative no-data template regardless of form status', () => {
      const statuses = [
        { tsb: -15, acwr: 1.0 }, // optimal
        { tsb: 30, acwr: 1.0 }, // detraining
        { tsb: -35, acwr: 1.0 }, // overload
      ];
      for (const s of statuses) {
        const plan = generateWeeklyPlan(makeMetrics(s), zones, '2026-02-16', 14);
        const types = plan.workouts.map((w) => w.type);
        expect(types).not.toContain('threshold-intervals');
        expect(types).not.toContain('vo2max-intervals');
        expect(types).not.toContain('tempo');
        expect(types).not.toContain('long-run');
      }
    });

    it('rationale mentions data stabilizing', () => {
      const plan = generateWeeklyPlan(
        makeMetrics({ tsb: -15, acwr: 1.0 }),
        zones,
        '2026-02-16',
        14,
      );
      expect(plan.workouts[0].rationale).toContain('stabilizing');
    });
  });

  describe('transitioning data (21-27 days)', () => {
    it('uses conservative no-data template for normal ACWR', () => {
      const plan = generateWeeklyPlan(
        makeMetrics({ tsb: -15, acwr: 1.0 }),
        zones,
        '2026-02-16',
        25,
      );
      const types = plan.workouts.map((w) => w.type);
      expect(types).not.toContain('threshold-intervals');
      expect(types).not.toContain('vo2max-intervals');
      expect(types).not.toContain('tempo');
      expect(types).not.toContain('long-run');
    });

    it('uses recovery plan for extreme ACWR (> 1.5) during transition', () => {
      const plan = generateWeeklyPlan(
        makeMetrics({ tsb: -15, acwr: 1.8 }),
        zones,
        '2026-02-16',
        25,
      );
      const types = plan.workouts.map((w) => w.type);
      // high-risk: downgradeToRecoveryWeek — no intensity
      expect(types).not.toContain('threshold-intervals');
      expect(types).not.toContain('vo2max-intervals');
      expect(types).not.toContain('long-run');
    });

    it('rationale mentions data stabilizing', () => {
      const plan = generateWeeklyPlan(
        makeMetrics({ tsb: -15, acwr: 1.0 }),
        zones,
        '2026-02-16',
        25,
      );
      expect(plan.workouts[0].rationale).toContain('stabilizing');
    });
  });

  describe('high risk (ACWR > 1.5, mature data)', () => {
    it('removes all high-intensity and long-run sessions across all form statuses', () => {
      const tsbValues = [-35, -15, 0, 10, 30];
      for (const tsb of tsbValues) {
        const plan = generateWeeklyPlan(
          makeMetrics({ tsb, acwr: 1.6 }),
          zones,
          '2026-02-16',
          MATURE,
        );
        const types = plan.workouts.map((w) => w.type);
        expect(types).not.toContain('vo2max-intervals');
        expect(types).not.toContain('threshold-intervals');
        expect(types).not.toContain('long-run');
      }
    });

    it('tempo sessions are downgraded to easy', () => {
      // Fresh template has tempo — verify it gets replaced
      const plan = generateWeeklyPlan(
        makeMetrics({ tsb: 10, acwr: 1.6 }),
        zones,
        '2026-02-16',
        MATURE,
      );
      const types = plan.workouts.map((w) => w.type);
      expect(types).not.toContain('tempo');
    });
  });

  describe('moderate risk (ACWR > 1.3, mature data)', () => {
    it('removes threshold/vo2max/long-run but keeps tempo', () => {
      const plan = generateWeeklyPlan(
        makeMetrics({ tsb: -15, acwr: 1.4 }),
        zones,
        '2026-02-16',
        MATURE,
      );
      const types = plan.workouts.map((w) => w.type);
      expect(types).not.toContain('vo2max-intervals');
      expect(types).not.toContain('threshold-intervals');
      expect(types).not.toContain('long-run');
      expect(types).toContain('tempo');
    });
  });

  describe('undertraining (ACWR < 0.8, mature data)', () => {
    it('upgrades one rest/recovery day to easy', () => {
      // Neutral template: easy, threshold, recovery, tempo, easy, rest, long-run
      const baseline = generateWeeklyPlan(
        makeMetrics({ tsb: 0, acwr: 1.0 }),
        zones,
        '2026-02-16',
        MATURE,
      );
      const undertrained = generateWeeklyPlan(
        makeMetrics({ tsb: 0, acwr: 0.7 }),
        zones,
        '2026-02-16',
        MATURE,
      );
      const baselineEasy = baseline.workouts.filter((w) => w.type === 'easy').length;
      const undertrainedEasy = undertrained.workouts.filter((w) => w.type === 'easy').length;
      expect(undertrainedEasy).toBeGreaterThan(baselineEasy);
    });

    it('does not upgrade the Saturday rest day (index 5)', () => {
      // Fresh template has rest at index 5
      const plan = generateWeeklyPlan(
        makeMetrics({ tsb: 10, acwr: 0.7 }),
        zones,
        '2026-02-16',
        MATURE,
      );
      // Saturday (index 5) should still be rest
      expect(plan.workouts[5].type).toBe('rest');
    });
  });

  describe('sweet spot (ACWR 0.8-1.3, mature data)', () => {
    it('preserves the original template', () => {
      const plan = generateWeeklyPlan(
        makeMetrics({ tsb: -15, acwr: 1.0 }),
        zones,
        '2026-02-16',
        MATURE,
      );
      const types = plan.workouts.map((w) => w.type);
      expect(types).toContain('threshold-intervals');
      expect(types).toContain('long-run');
    });
  });
});

describe('hard/easy alternation', () => {
  it('never has two intensity sessions back to back', () => {
    const intensityTypes = new Set([
      'threshold-intervals',
      'vo2max-intervals',
      'tempo',
      'long-run',
    ]);

    // Test across all form statuses
    const tsbValues = [-35, -15, 0, 10, 30];
    for (const tsb of tsbValues) {
      const plan = generateWeeklyPlan(makeMetrics({ tsb, acwr: 1.0 }), zones, '2026-02-16', MATURE);
      for (let i = 1; i < plan.workouts.length; i++) {
        const prev = plan.workouts[i - 1].type;
        const curr = plan.workouts[i].type;
        if (intensityTypes.has(curr) && intensityTypes.has(prev)) {
          // This should never happen
          expect(`${prev} followed by ${curr}`).toBe('not back-to-back intensity');
        }
      }
    }
  });
});

describe('estimateWorkoutTss', () => {
  it('rest workout returns 0', () => {
    const rest: PrescribedWorkout = {
      id: 'test',
      date: '2026-02-20',
      dayLabel: 'Monday',
      type: 'rest',
      title: 'Rest',
      steps: [],
      estimatedDurationSec: 0,
      estimatedTss: 0,
      rationale: '',
      isTaper: false,
    };
    expect(estimateWorkoutTss(rest)).toBe(0);
  });

  it('45min easy workout returns ~37 TSS (50 TSS/hr)', () => {
    const easy: PrescribedWorkout = {
      id: 'test',
      date: '2026-02-20',
      dayLabel: 'Monday',
      type: 'easy',
      title: 'Easy',
      steps: [],
      estimatedDurationSec: 45 * 60,
      estimatedTss: 0,
      rationale: '',
      isTaper: false,
    };
    expect(estimateWorkoutTss(easy)).toBe(38); // 0.75 * 50 = 37.5 → 38
  });
});

describe('estimateWorkoutDistance', () => {
  it('rest workout returns 0', () => {
    const rest: PrescribedWorkout = {
      id: 'test',
      date: '2026-02-20',
      dayLabel: 'Monday',
      type: 'rest',
      title: 'Rest',
      steps: [],
      estimatedDurationSec: 0,
      estimatedTss: 0,
      rationale: '',
      isTaper: false,
    };
    expect(estimateWorkoutDistance(rest, zones)).toBe(0);
  });

  it('easy workout returns reasonable distance', () => {
    const plan = generateWeeklyPlan(makeMetrics(), zones, '2026-02-20', MATURE);
    const easy = plan.workouts.find((w) => w.type === 'easy');
    if (!easy) return expect(easy).toBeDefined();
    const dist = estimateWorkoutDistance(easy, zones);
    // 45min at ~5:30/km pace ≈ 8.2km
    expect(dist).toBeGreaterThan(5000);
    expect(dist).toBeLessThan(15000);
  });
});

describe('workout structure', () => {
  it('threshold-intervals has warmup, work intervals, recovery intervals, cooldown', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -15, acwr: 1.0 }),
      zones,
      '2026-02-16',
      MATURE,
    );
    const threshold = plan.workouts.find((w) => w.type === 'threshold-intervals');
    expect(threshold).toBeDefined();
    expect(threshold?.steps[0].type).toBe('warmup');
    expect(threshold?.steps[1].type).toBe('work');
    expect(threshold?.steps[1].repeat).toBe(5);
    expect(threshold?.steps[1].zone).toBe('threshold');
    expect(threshold?.steps[2].type).toBe('recovery');
    expect(threshold?.steps[2].repeat).toBe(5);
    expect(threshold?.steps[3].type).toBe('cooldown');
  });

  it('long-run has easy portion followed by tempo portion', () => {
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -15, acwr: 1.0 }),
      zones,
      '2026-02-16',
      MATURE,
    );
    const longRun = plan.workouts.find((w) => w.type === 'long-run');
    expect(longRun).toBeDefined();
    expect(longRun?.steps).toHaveLength(2);
    expect(longRun?.steps[0].zone).toBe('easy');
    expect(longRun?.steps[1].zone).toBe('tempo');
  });
});

describe('all workout types produce valid TSS and distance', () => {
  const NON_REST_TYPES: Array<Exclude<WorkoutType, 'rest'>> = [
    'recovery',
    'easy',
    'long-run',
    'tempo',
    'threshold-intervals',
    'vo2max-intervals',
  ];

  it.each(NON_REST_TYPES)('"%s" returns positive TSS and distance', (type) => {
    // Generate a plan that includes all types by using different form statuses
    // Build a workout directly via a plan that would include this type
    const plan = generateWeeklyPlan(
      makeMetrics({ tsb: -15, acwr: 1.0 }),
      zones,
      '2026-02-16',
      MATURE,
    );
    // Find the workout or create a synthetic one
    const workout = plan.workouts.find((w) => w.type === type);
    if (workout) {
      expect(estimateWorkoutTss(workout)).toBeGreaterThan(0);
      expect(estimateWorkoutDistance(workout, zones)).toBeGreaterThan(0);
    } else {
      // Type not in this plan — create a synthetic workout to test estimation
      const synth: PrescribedWorkout = {
        id: 'test',
        date: '2026-02-20',
        dayLabel: 'Monday',
        type,
        title: type,
        steps: [
          {
            type: 'work',
            durationSec: 30 * 60,
            zone: 'easy',
            targetPaceMin: 360,
            targetPaceMax: 300,
          },
        ],
        estimatedDurationSec: 30 * 60,
        estimatedTss: 0,
        rationale: '',
        isTaper: false,
      };
      expect(estimateWorkoutTss(synth)).toBeGreaterThan(0);
      expect(estimateWorkoutDistance(synth, zones)).toBeGreaterThan(0);
    }
  });
});
