import { useDeferredValue, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { glassClass } from './Card.tsx';
import { Typography } from './Typography.tsx';
import { MetricLabel } from './MetricLabel.tsx';
import { cn } from '@/lib/utils.ts';
import type { MetricId } from '@/lib/explanations.ts';

interface ChartPreviewCardProps {
  title: string;
  icon?: LucideIcon;
  color?: string;
  compactHeight?: string;
  subtitle?: string;
  footer?: ReactNode;
  titleSlot?: ReactNode;
  metricId?: MetricId;
  rail?: ReactNode;
  children: ReactNode;
}

export const ChartPreviewCard = (props: ChartPreviewCardProps) => {
  const ready = useDeferredValue(true, false);
  const Icon = props.icon;

  return (
    <div className={cn(glassClass, 'flex flex-col rounded-2xl overflow-hidden p-4')}>
      <div className="flex items-center">
        {Icon && <Icon size={16} style={{ color: props.color }} />}
        {props.titleSlot ?? (
          <div className={cn('flex flex-1 items-center gap-1', Icon && 'ml-2')}>
            <Typography variant="title" className="text-left">
              {props.title}
            </Typography>
            {props.metricId && <MetricLabel metricId={props.metricId} size="sm" iconOnly />}
          </div>
        )}
        {!props.titleSlot && !Icon && <div className="flex-1" />}
      </div>

      {props.subtitle && (
        <Typography variant="caption" as="p" className="mb-2">
          {props.subtitle}
        </Typography>
      )}

      <div
        className={cn(
          props.compactHeight ?? 'h-[140px]',
          props.rail !== undefined && 'grid grid-cols-[100px_minmax(0,1fr)] gap-3',
        )}
      >
        {props.rail}
        <div className="h-full min-h-0 min-w-0">{ready && props.children}</div>
      </div>

      {props.footer}
    </div>
  );
};
