import { describe, it, expect } from 'vite-plus/test';
import { dailyMetricsFromSessions } from '@pacevault/engine/metrics.ts';
import { trainingEffectFromRecords } from '@pacevault/engine/trainingEffect.ts';
import { ctlOnDate } from '@/components/sessions/session/sessionFitness.ts';
import { createMockTrainingSession } from '@pacevault/testing/sessions.ts';
import { runningRecordSeries } from '@pacevault/testing/series.ts';
import { MS_PER_DAY } from '@pacevault/engine/time.ts';

describe(ctlOnDate.name, () => {
  it('training effect of an old session changes when fitness changes', () => {
    const now = Date.now();
    const oldSession = createMockTrainingSession({
      id: 'old',
      date: now - 60 * MS_PER_DAY,
      tss: 80,
    });
    const base = Array.from({ length: 20 }, (_, i) =>
      createMockTrainingSession({
        id: `base-${i}`,
        date: oldSession.date - (20 - i) * MS_PER_DAY,
        tss: 60,
      }),
    );
    const laterBlock = Array.from({ length: 40 }, (_, i) =>
      createMockTrainingSession({
        id: `later-${i}`,
        date: oldSession.date + (i + 1) * MS_PER_DAY,
        tss: 180,
      }),
    );
    const records = runningRecordSeries({ count: 3600, baseHrBpm: 165 });
    const effectWith = (ctl: number) =>
      trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl,
      });

    const before = dailyMetricsFromSessions({ sessions: [...base, oldSession], endDate: now });
    const after = dailyMetricsFromSessions({
      sessions: [...base, oldSession, ...laterBlock],
      endDate: now,
    });

    expect(after.at(-1)?.ctl).toBeGreaterThan(before.at(-1)?.ctl ?? 0);
    expect(effectWith(after.at(-1)?.ctl ?? 0)).not.toEqual(
      effectWith(ctlOnDate({ history: after, timestamp: oldSession.date })),
    );
    expect(ctlOnDate({ history: after, timestamp: oldSession.date })).toBe(
      ctlOnDate({ history: before, timestamp: oldSession.date }),
    );
    expect(effectWith(ctlOnDate({ history: after, timestamp: oldSession.date }))).toEqual(
      effectWith(ctlOnDate({ history: before, timestamp: oldSession.date })),
    );
  });
});
