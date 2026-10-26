import type { FC } from 'react';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { PvGaugeDial } from '@pacevault/ui/components/pvGaugeDial/PvGaugeDial.tsx';
import { MetricLabel } from '@/components/metricLabel/index.tsx';
import type { MetricId } from '@/components/metricLabel/explanations.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { formatNumber } from '@/lib/format/formatters.ts';
import { trainingEffectLabel, type TrainingEffectLabel } from '@pacevault/engine/trainingEffect.ts';
import { localizedTELabel } from '@/components/sessions/session/localizedTrainingEffect.ts';
import { TE_ZONES, fillOf } from '@/components/sessions/session/trainingEffectScale.ts';

const TEXT_CLASS_BY_TRAINING_EFFECT_LABEL: Record<TrainingEffectLabel, string> = {
  no_effect: 'text-text-tertiary',
  minor: 'text-accent',
  maintaining: 'text-status-success',
  improving: 'text-status-warning',
  highly_improving: 'text-chart-cadence',
  overreaching: 'text-status-danger',
};

interface TrainingEffectGaugeProps {
  value: number;
  metricId: MetricId;
}

export const TrainingEffectGauge: FC<TrainingEffectGaugeProps> = (props) => {
  const label = trainingEffectLabel(props.value);
  const textClass = TEXT_CLASS_BY_TRAINING_EFFECT_LABEL[label];
  return (
    <div className="w-28">
      <div className="flex flex-col items-center gap-1">
        <div className="relative w-full max-w-160px">
          <PvGaugeDial
            min={0}
            max={5}
            value={props.value}
            zones={TE_ZONES}
            valueFill={fillOf(props.value)}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-end">
            <PvTypography variant="h1" className={cn('leading-none pb-1', textClass)}>
              {formatNumber(props.value, 'fixed-one-decimal')}
            </PvTypography>
          </div>
        </div>
        <PvTypography
          variant="overline"
          as="p"
          className={cn('min-h-8 max-w-full text-center text-balance', textClass)}
        >
          {localizedTELabel(label)}
        </PvTypography>
        <MetricLabel metricId={props.metricId} size="sm" alwaysShowLabel />
      </div>
    </div>
  );
};
