import type { FC } from 'react';
import { ListChecks } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import {
  ONBOARDING_FLOW_STEPS,
  onboardingProgressOf,
  useOnboardingStore,
} from '@/store/onboarding.ts';
import { PvFloatingPill } from '@pacevault/ui/components/pvFloatingPill/PvFloatingPill.tsx';

export const ReopenPill: FC = () => {
  const step = useOnboardingStore((s) => s.step);
  let label = m.ui_onboarding_pill_start();
  if (step !== 'intro') {
    label = m.ui_onboarding_pill_continue({
      step: onboardingProgressOf(step),
      total: ONBOARDING_FLOW_STEPS.length,
    });
  }
  return (
    <PvFloatingPill
      data-layout="onboarding-pill"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] left-1/2 z-10 -translate-x-1/2"
      onClick={() => useOnboardingStore.getState().setOnboardingCardOpen(true)}
    >
      <ListChecks size={14} aria-hidden className="text-text-tertiary" />
      {label}
    </PvFloatingPill>
  );
};
