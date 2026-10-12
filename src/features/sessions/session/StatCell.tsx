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
  value: string;
  unit?: string;
  visual?: ReactNode;
  lines: [ReactNode, ReactNode];
}

export const StatLine = (props: { children?: ReactNode }) => (
  <Typography variant="caption" as="p" color="textTertiary" tabularNums noWrap className="h-4">
    {props.children}
  </Typography>
);

export const StatCell = (props: StatCellProps) => (
  <div data-stat={props.stat} className={cn(tileClass, 'min-w-0 p-3')}>
    <div className="flex h-28 min-w-0 flex-col gap-1">
      <div className="flex h-4 min-w-0 items-center justify-between gap-1">
        <Typography variant="overline" noWrap zeroMinWidth>
          {props.label}
        </Typography>
        <MetricLabel metricId={props.metricId} size="sm" iconOnly className="shrink-0" />
      </div>
      <div className="h-7 min-w-0">
        <Typography variant="h3" as="p" tabularNums noWrap>
          {props.value}
          {props.unit !== undefined && (
            <Typography variant="caption" className="ml-1 font-normal">
              {props.unit}
            </Typography>
          )}
        </Typography>
      </div>
      <div className="flex h-6 min-w-0 items-center">{props.visual}</div>
      <div className="flex h-8 min-w-0 flex-col">
        {props.lines[0]}
        {props.lines[1]}
      </div>
    </div>
  </div>
);
