import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';

interface OnboardingIntroActionsProps {
  onDemo: () => void;
}

export const OnboardingIntroActions: FC<OnboardingIntroActionsProps> = (props) => (
  <>
    <PvButton variant="secondary" onClick={props.onDemo}>
      {m.ui_onboarding_demo_title()}
    </PvButton>
    <PvButton onClick={() => useOnboardingStore.getState().startOnboardingSetup()}>
      {m.ui_onboarding_get_started()}
    </PvButton>
  </>
);
