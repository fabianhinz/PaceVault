import type { ReactNode } from 'react';
import { tileClass } from '@/components/ui/Card.tsx';
import { MetricLabel } from '@/components/ui/MetricLabel.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import type { MetricId } from '@/lib/explanations.ts';
import { cn } from '@/lib/utils.ts';

interface StatCellProps {
  stat: string;
  label: string;
  metricId: MetricId;
  relatedMetricIds?: MetricId[];
  info1: ReactNode;
  info2?: ReactNode;
  chart?: ReactNode;
  active?: boolean;
}

interface StatValueProps {
  value: string;
  unit?: string;
  lead?: string;
}

export const StatValue = (props: StatValueProps) => (
  <>
    {props.lead !== undefined && (
      <Typography variant="caption" className="mr-1 font-normal">
        {props.lead}
      </Typography>
    )}
    {props.value}
    {props.unit !== undefined && (
      <Typography variant="caption" className="ml-1 font-normal">
        {props.unit}
      </Typography>
    )}
  </>
);

export const StatCaption = (props: { children?: ReactNode }) => (
  <Typography variant="caption" as="p" color="textTertiary" tabularNums noWrap zeroMinWidth>
    {props.children}
  </Typography>
);

export const StatPair = (props: { start: ReactNode; end: ReactNode }) => (
  <div className="flex w-full min-w-0 items-center justify-between gap-1">
    <StatCaption>{props.start}</StatCaption>
    <StatCaption>{props.end}</StatCaption>
  </div>
);

export const StatCell = (props: StatCellProps) => (
  <div data-stat={props.stat} className={cn(tileClass, 'min-w-0 p-3')}>
    <div className="flex h-[84px] min-w-0 flex-col gap-1">
      <div className="flex h-4 min-w-0 items-center justify-between gap-1">
        <Typography
          variant="overline"
          noWrap
          zeroMinWidth
          tabularNums
          className={cn(props.active && 'text-text-primary')}
        >
          {props.label}
        </Typography>
        <span className="shrink-0">
          <MetricLabel
            metricId={props.metricId}
            relatedMetricIds={props.relatedMetricIds}
            size="sm"
            iconOnly
          />
        </span>
      </div>
      <div className="flex h-7 min-w-0 items-baseline justify-between gap-0.5">
        <Typography variant="h3" as="p" tabularNums className="shrink-0 whitespace-nowrap">
          {props.info1}
        </Typography>
        <div className="min-w-0 flex-1 text-right">{props.info2}</div>
      </div>
      <div className="flex h-8 min-w-0 items-center">{props.chart}</div>
    </div>
  </div>
);
