import { useEffect, useRef, type RefObject } from 'react';
import type { OnboardingStep } from '@/store/onboarding.ts';

/**
 * When the step changes and the control that changed it is gone (a source tile, Back on the
 * way to the source step), focus fell to the body: move it to the new step's heading.
 * A control that stays on screen, like Continue, keeps its focus.
 */
export const useStepFocusEffect = ({
  step,
  headingRef,
}: {
  step: OnboardingStep;
  headingRef: RefObject<HTMLElement | null>;
}): void => {
  const previousStep = useRef(step);
  useEffect(() => {
    if (previousStep.current === step) return;
    previousStep.current = step;
    const active = document.activeElement;
    if (active !== null && active !== document.body) return;
    headingRef.current?.focus();
  }, [step, headingRef]);
};
