import { describe, expect, it } from 'vite-plus/test';
import { shouldDismiss } from '../../src/lib/sheetDrag.ts';

describe('shouldDismiss', () => {
  it('springs back after a short slow pull', () => {
    expect(shouldDismiss({ offset: 40, velocity: 100, height: 400 })).toBe(false);
  });

  it('dismisses a pull past 30 % of the card height', () => {
    expect(shouldDismiss({ offset: 130, velocity: 0, height: 400 })).toBe(true);
  });

  it('dismisses a short fast flick', () => {
    expect(shouldDismiss({ offset: 20, velocity: 800, height: 400 })).toBe(true);
  });

  it('springs back after an upward flick', () => {
    expect(shouldDismiss({ offset: -20, velocity: -900, height: 400 })).toBe(false);
  });
});
