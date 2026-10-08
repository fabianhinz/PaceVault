import type { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';
import type { MetricId } from '@/lib/explanations.ts';
import { Typography } from './Typography.tsx';
import { MetricLabel } from './MetricLabel.tsx';

interface ListItemHeaderProps {
  variant: 'primary' | 'secondary';
  avatar?: ReactNode;
  primary: ReactNode;
  metricId?: MetricId;
  secondary?: ReactNode;
  disabled?: boolean;
}

export const ListItemHeader = (props: ListItemHeaderProps) => {
  const isPrimary = props.variant === 'primary';

  return (
    <span
      className={cn(
        'flex min-w-0 flex-1 items-center',
        isPrimary && 'gap-2',
        !isPrimary && 'gap-3',
        props.disabled && 'opacity-45',
      )}
    >
      {props.avatar !== undefined && (
        <span className={cn('grid shrink-0 place-items-center', !isPrimary && 'size-[30px]')}>
          {props.avatar}
        </span>
      )}
      <span className="min-w-0">
        <span className="flex items-center gap-1">
          <Typography
            variant={isPrimary ? 'title' : 'body1'}
            as={isPrimary ? 'h4' : 'span'}
            className="block text-left"
          >
            {props.primary}
          </Typography>
          {props.metricId && <MetricLabel metricId={props.metricId} size="sm" iconOnly />}
        </span>
        {props.secondary !== undefined && (
          <Typography variant="caption" className="block">
            {props.secondary}
          </Typography>
        )}
      </span>
    </span>
  );
};
