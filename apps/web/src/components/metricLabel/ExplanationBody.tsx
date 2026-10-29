import type { FC } from 'react';
import type { MetricExplanation } from '@/components/metricLabel/explanations.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { PvChip } from '@pacevault/ui/components/pvChip/PvChip.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';

interface ExplanationBodyProps {
  explanation: MetricExplanation;
  primary: boolean;
}

export const ExplanationBody: FC<ExplanationBodyProps> = (props) => (
  <div className={cn('space-y-2', !props.primary && 'border-t border-white/10 pt-3')}>
    <div className={cn('flex items-baseline gap-2', props.primary && 'max-lg:hidden')}>
      <PvTypography variant="subtitle1" className="font-semibold">
        {props.explanation.friendlyName}
      </PvTypography>
      {props.explanation.shortLabel && <PvChip>{props.explanation.shortLabel}</PvChip>}
    </div>

    <PvTypography>{props.explanation.oneLiner}</PvTypography>

    <PvTypography
      variant="caption"
      as="p"
      color="textTertiary"
      className="border-t border-white/10 pt-2"
    >
      {props.explanation.range}
    </PvTypography>
  </div>
);
