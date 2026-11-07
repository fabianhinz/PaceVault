import type { FC } from 'react';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { OnboardingIntro } from '@/components/onboarding/OnboardingIntro.tsx';
import { OnboardingIntroActions } from '@/components/onboarding/OnboardingIntroActions.tsx';
import { OnboardingStep } from '@/components/onboarding/OnboardingStep.tsx';
import type { ShellProps } from '@/components/onboarding/types.ts';

export const DesktopOnboarding: FC<ShellProps> = (props) => {
  const step = useOnboardingStore((s) => s.step);
  if (step === 'intro') {
    return (
      <PvCard
        floating
        data-layout="onboarding-card"
        className="fixed top-1/2 left-6 z-10 w-440px -translate-y-1/2 p-6"
      >
        <OnboardingIntro shell="card" />
        <div className="mt-4 flex justify-end gap-2">
          <OnboardingIntroActions onDemo={props.onDemo} />
        </div>
      </PvCard>
    );
  }
  return (
    <PvCard
      floating
      data-layout="onboarding-card"
      className="fixed top-6 bottom-6 left-6 z-10 w-440px p-6"
    >
      <OnboardingStep shell="card" thresholds={props.thresholds} onDemo={props.onDemo} />
    </PvCard>
  );
};
