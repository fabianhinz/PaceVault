import { describe, it, expect } from 'vitest';
import { computeMetrics } from '@/packages/engine/metrics.ts';
import { calculateTrainingEffect } from '@/packages/engine/trainingEffect.ts';
import { ctlOnDate } from '@/lib/sessionFitness.ts';
import { makeSession } from '@tests/factories/sessions.ts';
import { makeRunningRecords } from '@tests/factories/records.ts';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('ctlOnDate', () => {
  it('training effect of an old session changes when fitness changes', () => {
    const now = Date.now();
    const oldSession = makeSession({ id: 'old', date: now - 60 * DAY_MS, tss: 80 });
    const base = Array.from({ length: 20 }, (_, i) =>
      makeSession({ id: `base-${i}`, date: oldSession.date - (20 - i) * DAY_MS, tss: 60 }),
    );
    const laterBlock = Array.from({ length: 40 }, (_, i) =>
      makeSession({ id: `later-${i}`, date: oldSession.date + (i + 1) * DAY_MS, tss: 180 }),
    );
    const records = makeRunningRecords(3600, { baseHr: 165 });
    const effectWith = (ctl: number) => calculateTrainingEffect(records, 190, 50, 'male', ctl);

    const before = computeMetrics([...base, oldSession], { endDate: now });
    const after = computeMetrics([...base, oldSession, ...laterBlock], { endDate: now });

    expect(after.at(-1)?.ctl).toBeGreaterThan(before.at(-1)?.ctl ?? 0);
    expect(effectWith(after.at(-1)?.ctl ?? 0)).not.toEqual(
      effectWith(ctlOnDate(after, oldSession.date)),
    );
    expect(ctlOnDate(after, oldSession.date)).toBe(ctlOnDate(before, oldSession.date));
    expect(effectWith(ctlOnDate(after, oldSession.date))).toEqual(
      effectWith(ctlOnDate(before, oldSession.date)),
    );
  });
});
