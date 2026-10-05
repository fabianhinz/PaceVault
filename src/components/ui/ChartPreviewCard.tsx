import { useDeferredValue, useRef, type ReactNode } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { glassClass } from './Card.tsx';
import { Typography } from './Typography.tsx';
import { Button } from './Button.tsx';
import { MetricLabel } from './MetricLabel.tsx';
import { cn } from '@/lib/utils.ts';
import { useExpandCard } from '@/lib/hooks/useExpandCard.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
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
  children: (mode: 'compact' | 'expanded') => ReactNode;
}

export const ChartPreviewCard = (props: ChartPreviewCardProps) => {
  const ready = useDeferredValue(true, false);
  const Icon = props.icon;
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);
  const isDesktop = useIsDesktop();
  const isFullyExpanded = expandCard.isExpanded && !expandCard.isAnimating;

  return (
    <div ref={cardRef} className={cn(glassClass, 'flex flex-col rounded-2xl overflow-hidden p-4')}>
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
        {isDesktop && (
          <Button
            variant="ghost"
            size="icon"
            onClick={expandCard.toggle}
            aria-label={expandCard.isExpanded ? 'Collapse chart' : 'Expand chart'}
          >
            {expandCard.isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </Button>
        )}
      </div>

      {props.subtitle && (
        <Typography variant="caption" as="p" className="mb-2">
          {props.subtitle}
        </Typography>
      )}

      <div
        className={cn(
          expandCard.isExpanded ? 'flex-1 min-h-0' : `${props.compactHeight ?? 'h-[140px]'}`,
          props.rail !== undefined && 'grid grid-cols-[88px_minmax(0,1fr)] gap-3',
        )}
      >
        {props.rail}
        <div className="h-full min-h-0 min-w-0">
          {(ready || isFullyExpanded) && props.children(isFullyExpanded ? 'expanded' : 'compact')}
        </div>
      </div>

      {props.footer}
    </div>
  );
};
