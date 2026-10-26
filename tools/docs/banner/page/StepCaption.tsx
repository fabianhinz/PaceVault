import type { FC } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { FitText } from './FitText.tsx';

interface StepCaptionProps {
  step: number;
  label: string;
}

export const StepCaption: FC<StepCaptionProps> = (props) => (
  <div className="flex h-9 items-center gap-2.5">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-text-primary text-lg font-bold text-surface-base">
      {props.step}
    </span>
    <FitText className="flex-1">
      <PvTypography variant="title" as="span">
        {props.label}
      </PvTypography>
    </FitText>
  </div>
);
