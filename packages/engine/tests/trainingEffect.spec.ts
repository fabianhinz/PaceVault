import { describe, it, expect } from 'vite-plus/test';
import {
  trainingEffectFromRecords,
  trainingEffectLabel,
  trainingEffectSummary,
} from '../src/trainingEffect.ts';
import { DEFAULT_THRESHOLD_HRR } from '../src/stress.ts';
import type { SessionRecord } from '../src/types.ts';
import { runningRecordSeries, cyclingRecordSeries } from '../../testing/src/series.ts';
import { createMockSessionRecord } from '../../testing/src/records.ts';

describe('trainingEffect', () => {
  describe(trainingEffectFromRecords.name, () => {
    it('returns undefined when maxHr <= restHr', () => {
      const records = runningRecordSeries({ count: 3600 });
      expect(
        trainingEffectFromRecords({
          records,
          thresholds: { maxHr: 50, restHr: 50, gender: 'male' },
          ctl: 0,
        }),
      ).toBeUndefined();
      expect(
        trainingEffectFromRecords({
          records,
          thresholds: { maxHr: 40, restHr: 50, gender: 'male' },
          ctl: 0,
        }),
      ).toBeUndefined();
    });

    it('returns undefined when no records have HR data', () => {
      const records = runningRecordSeries({ count: 100 }).map((r) => ({
        ...r,
        hr: undefined,
      }));
      expect(
        trainingEffectFromRecords({
          records,
          thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
          ctl: 0,
        }),
      ).toBeUndefined();
    });

    it('1hr at exactly LT → aerobic TE 3.0 (reference anchor)', () => {
      const maxHr = 190;
      const restHr = 50;
      const ltHr = restHr + DEFAULT_THRESHOLD_HRR * (maxHr - restHr);
      const records: SessionRecord[] = Array.from({ length: 3600 }, (_, i) =>
        createMockSessionRecord({
          timestamp: i,
          hr: ltHr,
        }),
      );
      const result = trainingEffectFromRecords({
        records,
        thresholds: { maxHr, restHr, gender: 'male' },
        ctl: 0,
      });
      expect(result).toBeDefined();
      expect(result?.aerobic).toBe(3.0);
    });

    it('anchors the reference at the threshold HR when one is set', () => {
      const records: SessionRecord[] = Array.from({ length: 3600 }, (_, i) =>
        createMockSessionRecord({
          timestamp: i,
          hr: 165,
        }),
      );
      const thresholds = { maxHr: 190, restHr: 50, gender: 'male' as const, thresholdHr: 165 };

      expect(trainingEffectFromRecords({ records, thresholds, ctl: 0 })?.aerobic).toBe(3.0);
      const estimated = trainingEffectFromRecords({
        records,
        thresholds: { ...thresholds, thresholdHr: undefined },
        ctl: 0,
      });
      expect(estimated?.aerobic).toBeLessThan(3.0);
    });

    it('counts anaerobic time above the threshold HR when one is set', () => {
      const records: SessionRecord[] = Array.from({ length: 600 }, (_, i) =>
        createMockSessionRecord({
          timestamp: i,
          hr: 175,
        }),
      );
      const thresholds = { maxHr: 190, restHr: 50, gender: 'male' as const };

      expect(trainingEffectFromRecords({ records, thresholds, ctl: 0 })?.anaerobic).toBe(0);
      expect(
        trainingEffectFromRecords({
          records,
          thresholds: { ...thresholds, thresholdHr: 165 },
          ctl: 0,
        })?.anaerobic,
      ).toBeGreaterThan(0);
    });

    it('6min at exactly VO2max → anaerobic TE 3.0 (reference anchor)', () => {
      const maxHr = 190;
      const restHr = 50;
      const records: SessionRecord[] = Array.from({ length: 360 }, (_, i) =>
        createMockSessionRecord({
          timestamp: i,
          hr: maxHr,
        }),
      );
      const result = trainingEffectFromRecords({
        records,
        thresholds: { maxHr, restHr, gender: 'male' },
        ctl: 0,
      });
      expect(result).toBeDefined();
      expect(result?.anaerobic).toBe(3.0);
    });

    it('computes aerobic TE > 0 for a 1-hour running session with HR data', () => {
      const records = runningRecordSeries({ count: 3600, baseHrBpm: 155 });
      const result = trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 0,
      });

      expect(result).toBeDefined();
      expect(result?.aerobic).toBeGreaterThan(0);
      expect(result?.aerobic).toBeLessThanOrEqual(5);
    });

    it('aerobic TE is clamped to [0, 5]', () => {
      const records = runningRecordSeries({ count: 7200, baseHrBpm: 185 });
      const result = trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 0,
      });

      expect(result).toBeDefined();
      expect(result?.aerobic).toBeLessThanOrEqual(5);
      expect(result?.aerobic).toBeGreaterThanOrEqual(0);
    });

    it('anaerobic TE is 0 when HR stays well below 90% HRR', () => {
      const records = runningRecordSeries({ count: 3600, baseHrBpm: 100 });
      const result = trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 0,
      });

      expect(result).toBeDefined();
      expect(result?.anaerobic).toBe(0);
    });

    it('anaerobic TE > 0 when HR is above 90% HRR threshold', () => {
      const records = runningRecordSeries({ count: 600, baseHrBpm: 180 });
      const result = trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 0,
      });

      expect(result).toBeDefined();
      expect(result?.anaerobic).toBeGreaterThan(0);
    });

    it('higher CTL reduces TE for the same effort', () => {
      const records = runningRecordSeries({ count: 3600, baseHrBpm: 155 });

      const lowFitness = trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 0,
      });
      const highFitness = trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 100,
      });

      expect(lowFitness).toBeDefined();
      expect(highFitness).toBeDefined();
      if (!lowFitness || !highFitness) return;
      expect(lowFitness.aerobic).toBeGreaterThan(highFitness.aerobic);
    });

    it('gender affects the result through the Banister b-coefficient alone, as a cancels in aerobicTrimp/trimpRef', () => {
      const records: SessionRecord[] = Array.from({ length: 3600 }, (_, i) =>
        createMockSessionRecord({
          timestamp: i,
          hr: 78,
        }),
      );

      const male = trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 0,
      });
      const female = trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'female' },
        ctl: 0,
      });

      expect(male).toBeDefined();
      expect(female).toBeDefined();
      if (!male || !female) return;
      expect(female.aerobic).toBeGreaterThan(male.aerobic);
    });

    it('works with cycling records that have HR data', () => {
      const records = cyclingRecordSeries({ count: 3600, baseHrBpm: 150 });
      const result = trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 50,
      });

      expect(result).toBeDefined();
      expect(result?.aerobic).toBeGreaterThan(0);
    });

    it('short session produces lower TE than long session at same intensity', () => {
      const short = runningRecordSeries({ count: 600, baseHrBpm: 155 });
      const long = runningRecordSeries({ count: 3600, baseHrBpm: 155 });

      const shortTE = trainingEffectFromRecords({
        records: short,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 0,
      });
      const longTE = trainingEffectFromRecords({
        records: long,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 0,
      });

      expect(shortTE).toBeDefined();
      expect(longTE).toBeDefined();
      if (!shortTE || !longTE) return;
      expect(shortTE.aerobic).toBeLessThan(longTE.aerobic);
    });

    it('results are rounded to 1 decimal place', () => {
      const records = runningRecordSeries({ count: 3600, baseHrBpm: 155 });
      const result = trainingEffectFromRecords({
        records,
        thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
        ctl: 0,
      });

      expect(result).toBeDefined();
      expect(result?.aerobic.toString()).toMatch(/^\d+(\.\d)?$/);
      expect(result?.anaerobic.toString()).toMatch(/^\d+(\.\d)?$/);
    });

    describe('calibration regression — aerobic TE vs Garmin ranges', () => {
      const maxHr = 190;
      const restHr = 50;

      it('30-min easy run (baseHr≈100) at CTL=50 → TE 1.5–2.5', () => {
        const records = runningRecordSeries({ count: 1800, baseHrBpm: 100 });
        const result = trainingEffectFromRecords({
          records,
          thresholds: { maxHr, restHr, gender: 'male' },
          ctl: 50,
        });
        expect(result).toBeDefined();
        expect(result?.aerobic).toBeGreaterThanOrEqual(1.5);
        expect(result?.aerobic).toBeLessThanOrEqual(2.5);
      });

      it('1-hr easy run (baseHr≈145) at CTL=0 → TE 2.0–3.5', () => {
        const records = runningRecordSeries({ count: 3600, baseHrBpm: 145 });
        const result = trainingEffectFromRecords({
          records,
          thresholds: { maxHr, restHr, gender: 'male' },
          ctl: 0,
        });
        expect(result).toBeDefined();
        expect(result?.aerobic).toBeGreaterThanOrEqual(2.0);
        expect(result?.aerobic).toBeLessThanOrEqual(3.5);
      });

      it('1-hr moderate run (baseHr≈155) at CTL=50 → TE 2.5–3.5', () => {
        const records = runningRecordSeries({ count: 3600, baseHrBpm: 155 });
        const result = trainingEffectFromRecords({
          records,
          thresholds: { maxHr, restHr, gender: 'male' },
          ctl: 50,
        });
        expect(result).toBeDefined();
        expect(result?.aerobic).toBeGreaterThanOrEqual(2.5);
        expect(result?.aerobic).toBeLessThanOrEqual(3.5);
      });

      it('1-hr tempo run (baseHr≈170) at CTL=0 → TE 3.0–4.5', () => {
        const records = runningRecordSeries({ count: 3600, baseHrBpm: 170 });
        const result = trainingEffectFromRecords({
          records,
          thresholds: { maxHr, restHr, gender: 'male' },
          ctl: 0,
        });
        expect(result).toBeDefined();
        expect(result?.aerobic).toBeGreaterThanOrEqual(3.0);
        expect(result?.aerobic).toBeLessThanOrEqual(4.5);
      });

      it('higher CTL reduces TE by less than 33% (power-law softens scaling)', () => {
        const records = runningRecordSeries({ count: 3600, baseHrBpm: 155 });
        const ctl0 = trainingEffectFromRecords({
          records,
          thresholds: { maxHr, restHr, gender: 'male' },
          ctl: 0,
        });
        const ctl100 = trainingEffectFromRecords({
          records,
          thresholds: { maxHr, restHr, gender: 'male' },
          ctl: 100,
        });
        expect(ctl0).toBeDefined();
        expect(ctl100).toBeDefined();
        if (!ctl0 || !ctl100) return;
        const reduction = 1 - ctl100.aerobic / ctl0.aerobic;
        expect(reduction).toBeGreaterThan(0);
        expect(reduction).toBeLessThan(0.33);
      });
    });

    describe('calibration regression — anaerobic TE', () => {
      it('10-min intervals at a constant HR of 185 (HRR≈0.96) at CTL=0 → anaerobic TE 2.5–4.5', () => {
        const records: SessionRecord[] = Array.from({ length: 600 }, (_, i) =>
          createMockSessionRecord({
            timestamp: i,
            hr: 185,
          }),
        );
        const result = trainingEffectFromRecords({
          records,
          thresholds: { maxHr: 190, restHr: 50, gender: 'male' },
          ctl: 0,
        });
        expect(result).toBeDefined();
        expect(result?.anaerobic).toBeGreaterThanOrEqual(2.5);
        expect(result?.anaerobic).toBeLessThanOrEqual(4.5);
      });
    });
  });

  describe(trainingEffectLabel.name, () => {
    it('maps 0–0.9 to no_effect', () => {
      expect(trainingEffectLabel(0)).toBe('no_effect');
      expect(trainingEffectLabel(0.9)).toBe('no_effect');
    });

    it('maps 1.0–1.9 to minor', () => {
      expect(trainingEffectLabel(1.0)).toBe('minor');
      expect(trainingEffectLabel(1.9)).toBe('minor');
    });

    it('maps 2.0–2.9 to maintaining', () => {
      expect(trainingEffectLabel(2.0)).toBe('maintaining');
      expect(trainingEffectLabel(2.9)).toBe('maintaining');
    });

    it('maps 3.0–3.9 to improving', () => {
      expect(trainingEffectLabel(3.0)).toBe('improving');
      expect(trainingEffectLabel(3.9)).toBe('improving');
    });

    it('maps 4.0–4.9 to highly_improving', () => {
      expect(trainingEffectLabel(4.0)).toBe('highly_improving');
      expect(trainingEffectLabel(4.9)).toBe('highly_improving');
    });

    it('maps 5.0 to overreaching', () => {
      expect(trainingEffectLabel(5.0)).toBe('overreaching');
    });
  });

  describe(trainingEffectSummary.name, () => {
    it('returns too_easy key when both are below 1', () => {
      expect(trainingEffectSummary({ aerobic: 0.5, anaerobic: 0.5 })).toBe('too_easy');
    });

    it('returns extreme key when both are >= 4', () => {
      expect(trainingEffectSummary({ aerobic: 4.0, anaerobic: 4.0 })).toBe('extreme');
    });

    it('returns steady_aerobic key for steady effort', () => {
      expect(trainingEffectSummary({ aerobic: 3.5, anaerobic: 1.0 })).toBe('steady_aerobic');
    });

    it('returns high_intensity key for high-intensity session', () => {
      expect(trainingEffectSummary({ aerobic: 1.5, anaerobic: 3.5 })).toBe('high_intensity');
    });

    it('returns mixed_intensity key for balanced effort', () => {
      expect(trainingEffectSummary({ aerobic: 3.0, anaerobic: 2.5 })).toBe('mixed_intensity');
    });

    it('returns easy_maintenance key for moderate aerobic', () => {
      expect(trainingEffectSummary({ aerobic: 2.5, anaerobic: 0.5 })).toBe('easy_maintenance');
    });
  });
});
