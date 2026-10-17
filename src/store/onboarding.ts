import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type OnboardingStep = 'intro' | 'source' | 'you' | 'bike' | 'import';
export type OnboardingSource = 'intervals' | 'fit' | 'demo';

export const ONBOARDING_FLOW_STEPS: OnboardingStep[] = ['source', 'you', 'bike', 'import'];

interface OnboardingState {
  step: OnboardingStep;
  source: OnboardingSource | null;
  onboardingCardOpen: boolean;
  onboardingPreviewRevealed: boolean;
  startOnboardingSetup: () => void;
  pickOnboardingSource: (source: OnboardingSource) => void;
  nextOnboardingStep: () => void;
  previousOnboardingStep: () => void;
  setOnboardingCardOpen: (open: boolean) => void;
  revealOnboardingPreview: () => void;
}

const NEXT_STEP: Record<OnboardingStep, OnboardingStep> = {
  intro: 'source',
  source: 'you',
  you: 'bike',
  bike: 'import',
  import: 'import',
};

const PREVIOUS_STEP: Record<OnboardingStep, OnboardingStep> = {
  intro: 'intro',
  source: 'intro',
  you: 'source',
  bike: 'you',
  import: 'bike',
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
    pickOnboardingSource: (source) =>
      set((state) => {
        state.source = source;
      }),
    nextOnboardingStep: () =>
      set((state) => {
        if (state.step === 'source' && (state.source === null || state.source === 'demo')) return;
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
