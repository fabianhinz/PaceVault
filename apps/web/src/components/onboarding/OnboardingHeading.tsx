import type { FC } from 'react';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { ONBOARDING_HEADING_ID, type OnboardingShell } from '@/components/onboarding/types.ts';

interface OnboardingHeadingProps {
  shell: OnboardingShell;
  title: string;
  subtitle: string;
}

export const OnboardingHeading: FC<OnboardingHeadingProps> = (props) => {
  if (props.shell === 'dialog') {
    return (
      <div className="flex flex-col gap-2">
        <PvTypography variant="h1" as="h2" id={ONBOARDING_HEADING_ID}>
          {props.title}
        </PvTypography>
        <PvDialogDescription className="text-text-secondary">{props.subtitle}</PvDialogDescription>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <PvTypography variant="h1">{props.title}</PvTypography>
      <PvTypography variant="body1" color="textSecondary">
        {props.subtitle}
      </PvTypography>
    </div>
  );
};
