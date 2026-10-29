import { useRef, type FC } from 'react';
import { useOnboardingStore } from '@/store/onboarding.ts';
import { PvDialogBody } from '@pacevault/ui/components/pvDialog/PvDialogBody.tsx';
import { PvDialogFooter } from '@pacevault/ui/components/pvDialog/PvDialogFooter.tsx';
import type { ProfileGate } from '@/components/settings/hooks/types.ts';
import { OnboardingProgress } from './OnboardingProgress.tsx';
import { useStepFocusEffect } from './hooks/useStepFocusEffect.ts';
import { BackButton } from '@/components/onboarding/BackButton.tsx';
import { CardBody } from '@/components/onboarding/CardBody.tsx';
import { OnboardingHeading } from '@/components/onboarding/OnboardingHeading.tsx';
import { screenOf } from '@/components/onboarding/onboardingScreens.tsx';
import type { StepProps } from '@/components/onboarding/types.ts';

/** One flow screen: progress, question, subtitle, fields, then Back and the step's primary action. */
export const OnboardingStep: FC<StepProps> = (props) => {
  const step = useOnboardingStore((s) => s.step);
  const source = useOnboardingStore((s) => s.source);
  const headingRef = useRef<HTMLDivElement>(null);
  useStepFocusEffect({ step, headingRef });
  const profileGate: ProfileGate = { ready: props.thresholds.valid, save: props.thresholds.save };
  const screen = screenOf({ step, source, props, profileGate });
  const heading = (
    <div ref={headingRef} tabIndex={-1} className="outline-none">
      <OnboardingHeading shell={props.shell} title={screen.title} subtitle={screen.subtitle} />
    </div>
  );

  if (props.shell === 'dialog') {
    return (
      <>
        <PvDialogBody>
          <div className="flex flex-col gap-6">
            <OnboardingProgress />
            {heading}
            {screen.body !== null && <div>{screen.body}</div>}
          </div>
        </PvDialogBody>
        {screen.primary !== null && (
          <PvDialogFooter className="grid-cols-[auto_1fr]">
            <BackButton />
            {screen.primary}
          </PvDialogFooter>
        )}
      </>
    );
  }
  return (
    <>
      <OnboardingProgress />
      <CardBody>
        <div className="flex flex-col gap-8">
          {heading}
          {screen.body !== null && <div>{screen.body}</div>}
        </div>
      </CardBody>
      {screen.primary !== null && (
        <PvDialogFooter>
          <BackButton />
          {screen.primary}
        </PvDialogFooter>
      )}
    </>
  );
};
