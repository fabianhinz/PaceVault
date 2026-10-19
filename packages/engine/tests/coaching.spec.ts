import { describe, it, expect } from 'vite-plus/test';
import { getFormStatus, getInjuryRisk, getLoadState } from '../src/coaching.ts';

describe('getFormStatus', () => {
  it('boundary: TSB 25 => fresh, TSB 26 => detraining', () => {
    expect(getFormStatus(25)).toBe('fresh');
    expect(getFormStatus(26)).toBe('detraining');
  });

  it('boundary: TSB 5 => fresh, TSB 4 => neutral', () => {
    expect(getFormStatus(5)).toBe('fresh');
    expect(getFormStatus(4)).toBe('neutral');
  });

  it('boundary: TSB -10 => neutral, TSB -11 => optimal', () => {
    expect(getFormStatus(-10)).toBe('neutral');
    expect(getFormStatus(-11)).toBe('optimal');
  });

  it('boundary: TSB -30 => optimal, TSB -31 => overload', () => {
    expect(getFormStatus(-30)).toBe('optimal');
    expect(getFormStatus(-31)).toBe('overload');
  });
});

describe('getLoadState', () => {
  it('returns immature when dataMaturityDays < 21', () => {
    expect(getLoadState(1.0, 0)).toBe('immature');
    expect(getLoadState(1.0, 20)).toBe('immature');
    expect(getLoadState(2.0, 10)).toBe('immature');
    expect(getLoadState(0.5, 10)).toBe('immature');
  });

  it('returns transitioning when dataMaturityDays 21-27', () => {
    expect(getLoadState(1.0, 21)).toBe('transitioning');
    expect(getLoadState(1.0, 27)).toBe('transitioning');
    expect(getLoadState(0.5, 25)).toBe('transitioning');
    expect(getLoadState(1.4, 25)).toBe('transitioning');
  });

  it('returns high-risk during transition when ACWR > 1.5', () => {
    expect(getLoadState(1.51, 21)).toBe('high-risk');
    expect(getLoadState(2.0, 25)).toBe('high-risk');
    expect(getLoadState(1.6, 27)).toBe('high-risk');
  });

  it('boundary: 20 days is immature, 21 days is transitioning, 28 days is fully mature', () => {
    expect(getLoadState(1.0, 20)).toBe('immature');
    expect(getLoadState(1.0, 21)).toBe('transitioning');
    expect(getLoadState(1.0, 27)).toBe('transitioning');
    expect(getLoadState(1.0, 28)).toBe('sweet-spot');
  });

  it('returns high-risk when ACWR > 1.5 and data mature', () => {
    expect(getLoadState(1.51, 42)).toBe('high-risk');
    expect(getLoadState(2.0, 42)).toBe('high-risk');
  });

  it('returns moderate-risk when ACWR > 1.3 and <= 1.5', () => {
    expect(getLoadState(1.31, 42)).toBe('moderate-risk');
    expect(getLoadState(1.5, 42)).toBe('moderate-risk');
  });

  it('boundary: 1.3 is sweet-spot, 1.31 is moderate-risk', () => {
    expect(getLoadState(1.3, 42)).toBe('sweet-spot');
    expect(getLoadState(1.31, 42)).toBe('moderate-risk');
  });

  it('boundary: 1.5 is moderate-risk, 1.51 is high-risk', () => {
    expect(getLoadState(1.5, 42)).toBe('moderate-risk');
    expect(getLoadState(1.51, 42)).toBe('high-risk');
  });

  it('returns undertraining when ACWR < 0.8 and data mature', () => {
    expect(getLoadState(0.79, 42)).toBe('undertraining');
    expect(getLoadState(0.5, 42)).toBe('undertraining');
    expect(getLoadState(0.0, 42)).toBe('undertraining');
  });

  it('boundary: 0.8 is sweet-spot, 0.79 is undertraining', () => {
    expect(getLoadState(0.8, 42)).toBe('sweet-spot');
    expect(getLoadState(0.79, 42)).toBe('undertraining');
  });

  it('returns sweet-spot when ACWR 0.8-1.3 and data mature', () => {
    expect(getLoadState(0.8, 42)).toBe('sweet-spot');
    expect(getLoadState(1.0, 42)).toBe('sweet-spot');
    expect(getLoadState(1.3, 42)).toBe('sweet-spot');
  });

  it('dataMaturityDays=0 returns immature regardless of ACWR', () => {
    expect(getLoadState(0.0, 0)).toBe('immature');
    expect(getLoadState(1.0, 0)).toBe('immature');
    expect(getLoadState(1.5, 0)).toBe('immature');
    expect(getLoadState(2.0, 0)).toBe('immature');
    expect(getLoadState(100, 0)).toBe('immature');
  });
});

describe('threshold consistency: getLoadState and getInjuryRisk agree at boundaries', () => {
  it('ACWR at 1.3 is low risk and sweet-spot', () => {
    expect(getInjuryRisk(1.3)).toBe('low');
    expect(getLoadState(1.3, 42)).toBe('sweet-spot');
  });

  it('ACWR just above 1.3 is moderate risk and moderate-risk state', () => {
    const above = 1.3 + 0.01;
    expect(getInjuryRisk(above)).toBe('moderate');
    expect(getLoadState(above, 42)).toBe('moderate-risk');
  });

  it('ACWR at 1.5 is moderate risk and moderate-risk state', () => {
    expect(getInjuryRisk(1.5)).toBe('moderate');
    expect(getLoadState(1.5, 42)).toBe('moderate-risk');
  });

  it('ACWR just above 1.5 is high risk and high-risk state', () => {
    const above = 1.5 + 0.01;
    expect(getInjuryRisk(above)).toBe('high');
    expect(getLoadState(above, 42)).toBe('high-risk');
  });

  it('ACWR below 0.8 is low risk and undertraining', () => {
    const below = 0.8 - 0.01;
    expect(getInjuryRisk(below)).toBe('low');
    expect(getLoadState(below, 42)).toBe('undertraining');
  });

  it('ACWR at 0.8 is low risk and sweet-spot', () => {
    expect(getInjuryRisk(0.8)).toBe('low');
    expect(getLoadState(0.8, 42)).toBe('sweet-spot');
  });
});
