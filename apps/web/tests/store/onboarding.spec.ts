import { beforeEach, describe, expect, it } from 'vite-plus/test';
import { INITIAL_ONBOARDING_STORE_STATE, useOnboardingStore } from '@/store/onboarding.ts';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    useOnboardingStore.setState(INITIAL_ONBOARDING_STORE_STATE);
  });

  it('starts at the intro again after Delete all data reset a finished flow', () => {
    const store = useOnboardingStore.getState();
    store.chooseOnboardingSource('intervals');
    store.nextOnboardingStep();
    store.nextOnboardingStep();
    store.revealOnboardingPreview();

    useOnboardingStore.getState().resetOnboarding();

    const state = useOnboardingStore.getState();
    expect({
      step: state.step,
      source: state.source,
      onboardingCardOpen: state.onboardingCardOpen,
      onboardingPreviewRevealed: state.onboardingPreviewRevealed,
    }).toEqual(INITIAL_ONBOARDING_STORE_STATE);
  });
});
