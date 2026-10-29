import type { FC } from 'react';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import { OnboardingIntro } from '@/components/onboarding/OnboardingIntro.tsx';
import { OnboardingIntroActions } from '@/components/onboarding/OnboardingIntroActions.tsx';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep.tsx';
import type { ShellProps } from '@/components/onboarding/types.ts';

export const PhoneCard: FC<ShellProps> = (props) => {
  const step = useOnboardingStore((s) => s.step);
  if (step === 'intro') {
    return (
      <>
        <PvDialogBody>
          <OnboardingIntro shell="dialog" />
        </PvDialogBody>
        <PvDialogFooter>
          <OnboardingIntroActions onDemo={props.onDemo} />
        </PvDialogFooter>
      </>
    );
  }
  return <OnboardingStep shell="dialog" thresholds={props.thresholds} onDemo={props.onDemo} />;
};
