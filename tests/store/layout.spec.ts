import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '@/store/layout.ts';

const migrate = (persisted: Record<string, unknown>, version: number) => {
  const options = useLayoutStore.persist.getOptions();
  if (!options.migrate) {
    throw new Error('migrate missing');
  }
  return options.migrate(persisted, version) as Record<string, unknown>;
};

describe('useLayoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      onboardingComplete: false,
      demoMode: false,
      mobileSheetPosition: 0.5,
    });
  });

  it('defaults onboardingComplete to false', () => {
    expect(useLayoutStore.getState().onboardingComplete).toBe(false);
  });

  it('completeOnboarding sets onboardingComplete to true', () => {
    useLayoutStore.getState().completeOnboarding();
    expect(useLayoutStore.getState().onboardingComplete).toBe(true);
  });

  it('completeOnboarding is idempotent', () => {
    useLayoutStore.getState().completeOnboarding();
    useLayoutStore.getState().completeOnboarding();
    expect(useLayoutStore.getState().onboardingComplete).toBe(true);
  });

  it('defaults demoMode to false', () => {
    expect(useLayoutStore.getState().demoMode).toBe(false);
  });

  it('setDemoMode(true) sets demoMode to true', () => {
    useLayoutStore.getState().setDemoMode(true);
    expect(useLayoutStore.getState().demoMode).toBe(true);
  });

  it('setDemoMode(false) sets demoMode back to false', () => {
    useLayoutStore.getState().setDemoMode(true);
    useLayoutStore.getState().setDemoMode(false);
    expect(useLayoutStore.getState().demoMode).toBe(false);
  });

  it('setMobileSheetPosition stores a dragged position', () => {
    useLayoutStore.getState().setMobileSheetPosition(0.72);
    expect(useLayoutStore.getState().mobileSheetPosition).toBe(0.72);
  });

  describe('migrate', () => {
    it('maps an active v3 map view to peek and drops mobileMapActive', () => {
      const state = migrate({ onboardingComplete: true, demoMode: true, mobileMapActive: true }, 3);
      expect(state).toEqual({ onboardingComplete: true, demoMode: true, mobileSheetPosition: 0 });
    });

    it('maps an inactive v3 map view to the middle', () => {
      const state = migrate({ onboardingComplete: true, mobileMapActive: false }, 3);
      expect(state.mobileSheetPosition).toBe(0.5);
      expect(state).not.toHaveProperty('mobileMapActive');
    });

    it('defaults v1 and v2 state to the middle', () => {
      expect(migrate({ onboardingComplete: true }, 1)).toEqual({
        onboardingComplete: true,
        demoMode: false,
        mobileSheetPosition: 0.5,
      });
      expect(migrate({ onboardingComplete: true, demoMode: true }, 2).mobileSheetPosition).toBe(
        0.5,
      );
    });

    it('maps v4 snaps to positions and drops mobileSheetSnap', () => {
      expect(migrate({ mobileSheetSnap: 'peek' }, 4)).toEqual({ mobileSheetPosition: 0 });
      expect(migrate({ mobileSheetSnap: 'half' }, 4).mobileSheetPosition).toBe(0.5);
      expect(migrate({ mobileSheetSnap: 'full' }, 4).mobileSheetPosition).toBe(1);
    });

    it('falls back to the middle for an unrecognised value', () => {
      expect(migrate({ mobileSheetSnap: 'sideways' }, 4).mobileSheetPosition).toBe(0.5);
      expect(migrate({ mobileSheetPosition: 3 }, 5).mobileSheetPosition).toBe(0.5);
    });
  });
});
