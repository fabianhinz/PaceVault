import type { FC } from 'react';
import { PvSegmentBar } from '@pacevault/ui/components/pvSegmentBar/PvSegmentBar.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import {
  ONBOARDING_FLOW_STEPS,
  onboardingProgressOf,
  useOnboardingStore,
} from '@/store/onboarding.ts';

export const OnboardingProgress: FC = () => {
  const step = useOnboardingStore((s) => s.step);
  const done = onboardingProgressOf(step);
  const total = ONBOARDING_FLOW_STEPS.length;
  return (
    <div className="flex shrink-0 items-center gap-3" data-testid="onboarding-progress">
      <PvSegmentBar
        segments={[
          { key: 'done', value: done, className: 'bg-accent transition-[width] duration-300' },
          { key: 'left', value: total - done },
        ]}
      />
      <PvTypography variant="caption" tabularNums className="w-8 shrink-0 text-right">
        {done}/{total}
      </PvTypography>
    </div>
  );
};
