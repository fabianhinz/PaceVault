import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type OnboardingStep = 'intro' | 'source' | 'you' | 'thresholds' | 'import';
/** Where the first activities come from; the demo leaves onboarding instead of picking one. */
export type OnboardingSource = 'intervals' | 'fit';

export const ONBOARDING_FLOW_STEPS: OnboardingStep[] = ['source', 'you', 'thresholds', 'import'];

interface OnboardingState {
  step: OnboardingStep;
  source: OnboardingSource | null;
  onboardingCardOpen: boolean;
  onboardingPreviewRevealed: boolean;
  startOnboardingSetup: () => void;
  chooseOnboardingSource: (source: OnboardingSource) => void;
  nextOnboardingStep: () => void;
  previousOnboardingStep: () => void;
  setOnboardingCardOpen: (open: boolean) => void;
  revealOnboardingPreview: () => void;
}

const NEXT_STEP: Record<OnboardingStep, OnboardingStep> = {
  intro: 'source',
  source: 'you',
  you: 'thresholds',
  thresholds: 'import',
  import: 'import',
};

const PREVIOUS_STEP: Record<OnboardingStep, OnboardingStep> = {
  intro: 'intro',
  source: 'intro',
  you: 'source',
  thresholds: 'you',
  import: 'thresholds',
};

export const useOnboardingStore = create<OnboardingState>()(
  immer((set) => ({
    step: 'intro',
    source: null,
    onboardingCardOpen: false,
    onboardingPreviewRevealed: false,
    startOnboardingSetup: () =>
      set((state) => {
        state.step = 'source';
      }),
    chooseOnboardingSource: (source) =>
      set((state) => {
        state.source = source;
        state.step = NEXT_STEP.source;
      }),
    nextOnboardingStep: () =>
      set((state) => {
        state.step = NEXT_STEP[state.step];
      }),
    previousOnboardingStep: () =>
      set((state) => {
        state.step = PREVIOUS_STEP[state.step];
      }),
    setOnboardingCardOpen: (open) =>
      set((state) => {
        state.onboardingCardOpen = open;
      }),
    revealOnboardingPreview: () =>
      set((state) => {
        state.onboardingPreviewRevealed = true;
        state.onboardingCardOpen = true;
      }),
  })),
);

/** 1-based position of a flow step in the "n/4" progress; the intro has none. */
export const onboardingProgressOf = (step: OnboardingStep): number =>
  ONBOARDING_FLOW_STEPS.indexOf(step) + 1;
