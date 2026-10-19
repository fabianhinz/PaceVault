import { SegmentBar } from '@pacevault/ui/components/SegmentBar.tsx';
import { Typography } from '@pacevault/ui/components/Typography.tsx';
import {
  ONBOARDING_FLOW_STEPS,
  onboardingProgressOf,
  useOnboardingStore,
} from '@/store/onboarding.ts';

export const OnboardingProgress = () => {
  const step = useOnboardingStore((s) => s.step);
  const done = onboardingProgressOf(step);
  const total = ONBOARDING_FLOW_STEPS.length;
  return (
    <div className="flex shrink-0 items-center gap-3" data-testid="onboarding-progress">
      <SegmentBar
        segments={[
          { key: 'done', value: done, className: 'bg-accent transition-[width] duration-300' },
          { key: 'left', value: total - done },
        ]}
      />
      <Typography variant="caption" tabularNums className="w-8 shrink-0 text-right">
        {done}/{total}
      </Typography>
    </div>
  );
};
