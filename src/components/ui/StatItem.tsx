import type { ReactNode } from 'react';
import { Typography } from './Typography.tsx';
import { MetricLabel } from './MetricLabel.tsx';
import type { MetricId } from '@/lib/explanations.ts';

interface StatItemProps {
  label: string;
  value: ReactNode;
  unit?: string;
  metricId?: MetricId;
  subDetail?: ReactNode;
}

export const StatItem = (props: StatItemProps) => {
  return (
    <div className="space-y-0.5 h-[80px]">
      <div className="flex items-center justify-between gap-1">
        <Typography variant="overline" as="span" noWrap zeroMinWidth>
          {props.label}
        </Typography>
        {props.metricId && (
          <MetricLabel metricId={props.metricId} size="sm" contextLabel={props.label} />
        )}
      </div>
      <Typography variant="h3" as="p">
        {props.value}
        {props.unit && (
          <Typography variant="caption" as="span" className="ml-1 font-normal">
            {props.unit}
          </Typography>
        )}
      </Typography>
      {props.subDetail && <div className="mt-0.5">{props.subDetail}</div>}
    </div>
  );
};
