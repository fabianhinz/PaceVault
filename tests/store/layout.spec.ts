import { describe, it, expect, beforeEach } from 'vitest';
import { useLayoutStore } from '@/store/layout.ts';

describe('useLayoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({
      onboardingComplete: false,
      demoMode: false,
      mobileMapActive: false,
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

  it('toggleMobileMap flips to true', () => {
    useLayoutStore.getState().toggleMobileMap();
    expect(useLayoutStore.getState().mobileMapActive).toBe(true);
  });

  it('double toggleMobileMap returns to false', () => {
    useLayoutStore.getState().toggleMobileMap();
    useLayoutStore.getState().toggleMobileMap();
    expect(useLayoutStore.getState().mobileMapActive).toBe(false);
  });
});
