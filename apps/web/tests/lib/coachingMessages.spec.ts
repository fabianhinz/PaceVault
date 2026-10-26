import { describe, it, expect } from 'vite-plus/test';
import {
  getCoachingRecommendation,
  getFormMessage,
  getFormMessageDetailed,
} from '@/lib/coachingMessages.ts';
import type { FormStatus } from '@pacevault/engine/types.ts';
import type { CoachingRecommendation } from '@/types.ts';
import { createMockCoachingRecommendation } from '@tests/factories/coaching.ts';

const ALL_STATUSES: FormStatus[] = ['detraining', 'fresh', 'neutral', 'optimal', 'overload'];

describe(getFormMessageDetailed.name, () => {
  describe('immature data (< 28 days)', () => {
    it.each(ALL_STATUSES)(
      '"%s" returns an immature-data message mentioning stabilizing',
      (status) => {
        const rec = createMockCoachingRecommendation({ status, dataMaturityDays: 10 });
        const msg = getFormMessageDetailed(rec);
        expect(msg).toContain('stabilizing');
        expect(msg.length).toBeGreaterThan(0);
      },
    );

    it('immature data message does not reference ACWR-specific risk language', () => {
      const rec = createMockCoachingRecommendation({
        status: 'fresh',
        dataMaturityDays: 5,
        acwr: 2.0,
        injuryRisk: 'high',
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg).not.toContain('injury risk');
      expect(msg).not.toContain('danger zone');
      expect(msg).not.toContain('ramp rate');
    });

    it('boundary: 20 days is immature, 21-27 transitioning (same messages), 28 is mature', () => {
      const immature = createMockCoachingRecommendation({
        status: 'neutral',
        dataMaturityDays: 20,
      });
      const transitioning = createMockCoachingRecommendation({
        status: 'neutral',
        dataMaturityDays: 25,
      });
      const mature = createMockCoachingRecommendation({
        status: 'neutral',
        dataMaturityDays: 28,
        acwr: 1.0,
      });
      expect(getFormMessageDetailed(immature)).toContain('stabilizing');
      expect(getFormMessageDetailed(transitioning)).toContain('stabilizing');
      expect(getFormMessageDetailed(mature)).not.toContain('stabilizing');
    });
  });

  describe('undertraining (ACWR < 0.8, mature data)', () => {
    it.each(ALL_STATUSES)('"%s" returns an undertraining message', (status) => {
      const rec = createMockCoachingRecommendation({
        status,
        acwr: 0.5,
        injuryRisk: 'low',
        dataMaturityDays: 42,
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg.length).toBeGreaterThan(0);
    });

    it('detraining + undertraining mentions deconditioning', () => {
      const rec = createMockCoachingRecommendation({
        status: 'detraining',
        acwr: 0.3,
        dataMaturityDays: 42,
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg).toContain('deconditioning');
    });

    it('fresh + undertraining mentions below baseline', () => {
      const rec = createMockCoachingRecommendation({
        status: 'fresh',
        acwr: 0.6,
        dataMaturityDays: 42,
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg).toContain('below');
    });
  });

  describe('sweet spot (low risk, ACWR >= 0.8, mature data)', () => {
    it.each(ALL_STATUSES)(
      '"%s" returns a sweet-spot message that differs from standard',
      (status) => {
        const rec = createMockCoachingRecommendation({
          status,
          acwr: 1.0,
          injuryRisk: 'low',
          dataMaturityDays: 42,
        });
        const detailed = getFormMessageDetailed(rec);
        const standard = getFormMessage(status);
        expect(detailed).not.toBe(standard);
        expect(detailed.length).toBeGreaterThan(standard.length);
      },
    );
  });

  describe('moderate risk (mature data)', () => {
    it.each(ALL_STATUSES)('"%s" with moderate risk returns a risk-aware message', (status) => {
      const rec = createMockCoachingRecommendation({
        status,
        acwr: 1.4,
        injuryRisk: 'moderate',
        dataMaturityDays: 42,
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg.length).toBeGreaterThan(0);
    });

    it('fresh + moderate risk warns about ramp', () => {
      const rec = createMockCoachingRecommendation({
        status: 'fresh',
        acwr: 1.4,
        injuryRisk: 'moderate',
        dataMaturityDays: 42,
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg).toContain('ramp');
    });
  });

  describe('high risk (mature data)', () => {
    it.each(ALL_STATUSES)('"%s" with high risk returns a strong warning', (status) => {
      const rec = createMockCoachingRecommendation({
        status,
        acwr: 1.8,
        injuryRisk: 'high',
        dataMaturityDays: 42,
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg.length).toBeGreaterThan(0);
    });

    it('overload + high risk is the strongest warning', () => {
      const rec = createMockCoachingRecommendation({
        status: 'overload',
        acwr: 2.0,
        injuryRisk: 'high',
        dataMaturityDays: 42,
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg).toContain('highest-risk');
    });

    it('fresh + high risk does not suggest racing', () => {
      const rec = createMockCoachingRecommendation({
        status: 'fresh',
        acwr: 1.8,
        injuryRisk: 'high',
        dataMaturityDays: 42,
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg).not.toContain('ideal state for racing');
    });
  });

  describe('priority order', () => {
    it('immature data takes priority over high ACWR risk', () => {
      const rec = createMockCoachingRecommendation({
        status: 'fresh',
        acwr: 2.0,
        injuryRisk: 'high',
        dataMaturityDays: 10,
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg).toContain('stabilizing');
    });

    it('transitioning with extreme ACWR returns risk message, not immature', () => {
      const rec = createMockCoachingRecommendation({
        status: 'fresh',
        acwr: 1.8,
        injuryRisk: 'high',
        dataMaturityDays: 25,
      });
      const msg = getFormMessageDetailed(rec);
      expect(msg).not.toContain('stabilizing');
      expect(msg.length).toBeGreaterThan(0);
    });

    it('undertraining takes priority over low-risk sweet-spot message', () => {
      const sweetSpot = createMockCoachingRecommendation({
        status: 'neutral',
        acwr: 1.0,
        injuryRisk: 'low',
        dataMaturityDays: 42,
      });
      const undertraining = createMockCoachingRecommendation({
        status: 'neutral',
        acwr: 0.5,
        injuryRisk: 'low',
        dataMaturityDays: 42,
      });
      expect(getFormMessageDetailed(sweetSpot)).not.toBe(getFormMessageDetailed(undertraining));
    });
  });
});

describe('message uniqueness', () => {
  it('all 25 status x load-state messages are unique and non-trivial', () => {
    const messages = new Set<string>();
    const loadConfigs: Array<{
      acwr: number;
      dataMaturityDays: number;
      injuryRisk: CoachingRecommendation['injuryRisk'];
    }> = [
      { acwr: 1.0, dataMaturityDays: 10, injuryRisk: 'low' }, // immature
      { acwr: 0.5, dataMaturityDays: 42, injuryRisk: 'low' }, // undertraining
      { acwr: 1.0, dataMaturityDays: 42, injuryRisk: 'low' }, // sweet-spot
      { acwr: 1.4, dataMaturityDays: 42, injuryRisk: 'moderate' }, // moderate-risk
      { acwr: 1.8, dataMaturityDays: 42, injuryRisk: 'high' }, // high-risk
    ];

    for (const config of loadConfigs) {
      for (const status of ALL_STATUSES) {
        const rec = createMockCoachingRecommendation({ status, ...config });
        const msg = getFormMessageDetailed(rec);
        expect(msg.length).toBeGreaterThan(50);
        messages.add(msg);
      }
    }

    expect(messages.size).toBe(25);
  });
});

describe(getCoachingRecommendation.name, () => {
  it('returns neutral recommendation for undefined metrics', () => {
    const rec = getCoachingRecommendation({ metrics: undefined, historyDays: 0 });
    expect(rec.status).toBe('neutral');
    expect(rec.tsb).toBe(0);
    expect(rec.acwr).toBe(0);
    expect(rec.injuryRisk).toBe('low');
  });

  it('maps high TSB to detraining', () => {
    const rec = getCoachingRecommendation({
      metrics: {
        date: '2024-01-01',
        tss: 0,
        ctl: 50,
        atl: 20,
        tsb: 30,
        acwr: 0.4,
      },
      historyDays: 42,
    });
    expect(rec.status).toBe('detraining');
  });

  it('maps positive TSB (5-25) to fresh', () => {
    const rec = getCoachingRecommendation({
      metrics: {
        date: '2024-01-01',
        tss: 0,
        ctl: 60,
        atl: 50,
        tsb: 10,
        acwr: 0.83,
      },
      historyDays: 42,
    });
    expect(rec.status).toBe('fresh');
  });

  it('maps TSB near zero (-10 to 5) to neutral', () => {
    const rec = getCoachingRecommendation({
      metrics: {
        date: '2024-01-01',
        tss: 0,
        ctl: 50,
        atl: 52,
        tsb: -2,
        acwr: 1.04,
      },
      historyDays: 42,
    });
    expect(rec.status).toBe('neutral');
  });

  it('maps negative TSB (-30 to -10) to optimal', () => {
    const rec = getCoachingRecommendation({
      metrics: {
        date: '2024-01-01',
        tss: 0,
        ctl: 50,
        atl: 70,
        tsb: -20,
        acwr: 1.4,
      },
      historyDays: 42,
    });
    expect(rec.status).toBe('optimal');
  });

  it('maps very negative TSB (< -30) to overload', () => {
    const rec = getCoachingRecommendation({
      metrics: {
        date: '2024-01-01',
        tss: 0,
        ctl: 40,
        atl: 80,
        tsb: -40,
        acwr: 2.0,
      },
      historyDays: 42,
    });
    expect(rec.status).toBe('overload');
  });

  it('sets injury risk based on ACWR', () => {
    const low = getCoachingRecommendation({
      metrics: {
        date: '2024-01-01',
        tss: 0,
        ctl: 50,
        atl: 55,
        tsb: -5,
        acwr: 1.1,
      },
      historyDays: 42,
    });
    expect(low.injuryRisk).toBe('low');

    const moderate = getCoachingRecommendation({
      metrics: {
        date: '2024-01-01',
        tss: 0,
        ctl: 50,
        atl: 70,
        tsb: -20,
        acwr: 1.4,
      },
      historyDays: 42,
    });
    expect(moderate.injuryRisk).toBe('moderate');

    const high = getCoachingRecommendation({
      metrics: {
        date: '2024-01-01',
        tss: 0,
        ctl: 40,
        atl: 80,
        tsb: -40,
        acwr: 2.0,
      },
      historyDays: 42,
    });
    expect(high.injuryRisk).toBe('high');
  });

  it('stores dataMaturityDays from historyDays argument', () => {
    const rec = getCoachingRecommendation({
      metrics: {
        date: '2024-01-01',
        tss: 0,
        ctl: 50,
        atl: 50,
        tsb: 0,
        acwr: 1.0,
      },
      historyDays: 15,
    });
    expect(rec.dataMaturityDays).toBe(15);
  });
});
