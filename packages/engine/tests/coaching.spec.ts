import { describe, it, expect } from 'vite-plus/test';
import { formStatusFromTsb, injuryRiskFromAcwr, loadStateFromAcwr } from '../src/coaching.ts';

describe('coaching', () => {
  describe(formStatusFromTsb.name, () => {
    it('boundary: TSB 25 => fresh, TSB 26 => detraining', () => {
      expect(formStatusFromTsb(25)).toBe('fresh');
      expect(formStatusFromTsb(26)).toBe('detraining');
    });

    it('boundary: TSB 5 => fresh, TSB 4 => neutral', () => {
      expect(formStatusFromTsb(5)).toBe('fresh');
      expect(formStatusFromTsb(4)).toBe('neutral');
    });

    it('boundary: TSB -10 => neutral, TSB -11 => optimal', () => {
      expect(formStatusFromTsb(-10)).toBe('neutral');
      expect(formStatusFromTsb(-11)).toBe('optimal');
    });

    it('boundary: TSB -30 => optimal, TSB -31 => overload', () => {
      expect(formStatusFromTsb(-30)).toBe('optimal');
      expect(formStatusFromTsb(-31)).toBe('overload');
    });
  });

  describe(loadStateFromAcwr.name, () => {
    it('returns immature when dataMaturityDays < 21', () => {
      expect(loadStateFromAcwr({ acwr: 1.0, dataMaturityDays: 0 })).toBe('immature');
      expect(loadStateFromAcwr({ acwr: 1.0, dataMaturityDays: 20 })).toBe('immature');
      expect(loadStateFromAcwr({ acwr: 2.0, dataMaturityDays: 10 })).toBe('immature');
      expect(loadStateFromAcwr({ acwr: 0.5, dataMaturityDays: 10 })).toBe('immature');
    });

    it('returns transitioning when dataMaturityDays 21-27', () => {
      expect(loadStateFromAcwr({ acwr: 1.0, dataMaturityDays: 21 })).toBe('transitioning');
      expect(loadStateFromAcwr({ acwr: 1.0, dataMaturityDays: 27 })).toBe('transitioning');
      expect(loadStateFromAcwr({ acwr: 0.5, dataMaturityDays: 25 })).toBe('transitioning');
      expect(loadStateFromAcwr({ acwr: 1.4, dataMaturityDays: 25 })).toBe('transitioning');
    });

    it('returns high-risk during transition when ACWR > 1.5', () => {
      expect(loadStateFromAcwr({ acwr: 1.51, dataMaturityDays: 21 })).toBe('high-risk');
      expect(loadStateFromAcwr({ acwr: 2.0, dataMaturityDays: 25 })).toBe('high-risk');
      expect(loadStateFromAcwr({ acwr: 1.6, dataMaturityDays: 27 })).toBe('high-risk');
    });

    it('boundary: 20 days is immature, 21 days is transitioning, 28 days is fully mature', () => {
      expect(loadStateFromAcwr({ acwr: 1.0, dataMaturityDays: 20 })).toBe('immature');
      expect(loadStateFromAcwr({ acwr: 1.0, dataMaturityDays: 21 })).toBe('transitioning');
      expect(loadStateFromAcwr({ acwr: 1.0, dataMaturityDays: 27 })).toBe('transitioning');
      expect(loadStateFromAcwr({ acwr: 1.0, dataMaturityDays: 28 })).toBe('sweet-spot');
    });

    it('returns high-risk when ACWR > 1.5 and data mature', () => {
      expect(loadStateFromAcwr({ acwr: 1.51, dataMaturityDays: 42 })).toBe('high-risk');
      expect(loadStateFromAcwr({ acwr: 2.0, dataMaturityDays: 42 })).toBe('high-risk');
    });

    it('returns moderate-risk when ACWR > 1.3 and <= 1.5', () => {
      expect(loadStateFromAcwr({ acwr: 1.31, dataMaturityDays: 42 })).toBe('moderate-risk');
      expect(loadStateFromAcwr({ acwr: 1.5, dataMaturityDays: 42 })).toBe('moderate-risk');
    });

    it('boundary: 1.3 is sweet-spot, 1.31 is moderate-risk', () => {
      expect(loadStateFromAcwr({ acwr: 1.3, dataMaturityDays: 42 })).toBe('sweet-spot');
      expect(loadStateFromAcwr({ acwr: 1.31, dataMaturityDays: 42 })).toBe('moderate-risk');
    });

    it('boundary: 1.5 is moderate-risk, 1.51 is high-risk', () => {
      expect(loadStateFromAcwr({ acwr: 1.5, dataMaturityDays: 42 })).toBe('moderate-risk');
      expect(loadStateFromAcwr({ acwr: 1.51, dataMaturityDays: 42 })).toBe('high-risk');
    });

    it('returns undertraining when ACWR < 0.8 and data mature', () => {
      expect(loadStateFromAcwr({ acwr: 0.79, dataMaturityDays: 42 })).toBe('undertraining');
      expect(loadStateFromAcwr({ acwr: 0.5, dataMaturityDays: 42 })).toBe('undertraining');
      expect(loadStateFromAcwr({ acwr: 0.0, dataMaturityDays: 42 })).toBe('undertraining');
    });

    it('boundary: 0.8 is sweet-spot, 0.79 is undertraining', () => {
      expect(loadStateFromAcwr({ acwr: 0.8, dataMaturityDays: 42 })).toBe('sweet-spot');
      expect(loadStateFromAcwr({ acwr: 0.79, dataMaturityDays: 42 })).toBe('undertraining');
    });

    it('returns sweet-spot when ACWR 0.8-1.3 and data mature', () => {
      expect(loadStateFromAcwr({ acwr: 0.8, dataMaturityDays: 42 })).toBe('sweet-spot');
      expect(loadStateFromAcwr({ acwr: 1.0, dataMaturityDays: 42 })).toBe('sweet-spot');
      expect(loadStateFromAcwr({ acwr: 1.3, dataMaturityDays: 42 })).toBe('sweet-spot');
    });

    it('dataMaturityDays=0 returns immature regardless of ACWR', () => {
      expect(loadStateFromAcwr({ acwr: 0.0, dataMaturityDays: 0 })).toBe('immature');
      expect(loadStateFromAcwr({ acwr: 1.0, dataMaturityDays: 0 })).toBe('immature');
      expect(loadStateFromAcwr({ acwr: 1.5, dataMaturityDays: 0 })).toBe('immature');
      expect(loadStateFromAcwr({ acwr: 2.0, dataMaturityDays: 0 })).toBe('immature');
      expect(loadStateFromAcwr({ acwr: 100, dataMaturityDays: 0 })).toBe('immature');
    });
  });

  describe('threshold consistency', () => {
    it('ACWR at 1.3 is low risk and sweet-spot', () => {
      expect(injuryRiskFromAcwr(1.3)).toBe('low');
      expect(loadStateFromAcwr({ acwr: 1.3, dataMaturityDays: 42 })).toBe('sweet-spot');
    });

    it('ACWR just above 1.3 is moderate risk and moderate-risk state', () => {
      const above = 1.3 + 0.01;
      expect(injuryRiskFromAcwr(above)).toBe('moderate');
      expect(loadStateFromAcwr({ acwr: above, dataMaturityDays: 42 })).toBe('moderate-risk');
    });

    it('ACWR at 1.5 is moderate risk and moderate-risk state', () => {
      expect(injuryRiskFromAcwr(1.5)).toBe('moderate');
      expect(loadStateFromAcwr({ acwr: 1.5, dataMaturityDays: 42 })).toBe('moderate-risk');
    });

    it('ACWR just above 1.5 is high risk and high-risk state', () => {
      const above = 1.5 + 0.01;
      expect(injuryRiskFromAcwr(above)).toBe('high');
      expect(loadStateFromAcwr({ acwr: above, dataMaturityDays: 42 })).toBe('high-risk');
    });

    it('ACWR below 0.8 is low risk and undertraining', () => {
      const below = 0.8 - 0.01;
      expect(injuryRiskFromAcwr(below)).toBe('low');
      expect(loadStateFromAcwr({ acwr: below, dataMaturityDays: 42 })).toBe('undertraining');
    });

    it('ACWR at 0.8 is low risk and sweet-spot', () => {
      expect(injuryRiskFromAcwr(0.8)).toBe('low');
      expect(loadStateFromAcwr({ acwr: 0.8, dataMaturityDays: 42 })).toBe('sweet-spot');
    });
  });
});
