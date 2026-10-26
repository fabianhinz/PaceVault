import type { FC } from 'react';
import { PvDialogDescription } from '@pacevault/ui/components/pvDialog/PvDialogDescription.tsx';
import { PvDialogTitle } from '@pacevault/ui/components/pvDialog/PvDialogTitle.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import type { OnboardingShell } from '@/features/onboarding/types.ts';

interface OnboardingHeadingProps {
  shell: OnboardingShell;
  title: string;
  subtitle: string;
}

export const OnboardingHeading: FC<OnboardingHeadingProps> = (props) => {
  if (props.shell === 'dialog') {
    return (
      <div className="flex flex-col gap-2">
        <PvDialogTitle className="text-2xl font-bold">{props.title}</PvDialogTitle>
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
