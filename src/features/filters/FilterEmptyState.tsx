import { CircleAlert, SearchX, type LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { cn } from '@/lib/utils.ts';

interface FilterEmptyStateProps {
  kind: 'notUnderstood' | 'noMatch';
  description: string;
}

const emptyIcons: Record<FilterEmptyStateProps['kind'], LucideIcon> = {
  notUnderstood: CircleAlert,
  noMatch: SearchX,
};

export const FilterEmptyState = (props: FilterEmptyStateProps) => {
  const Icon = emptyIcons[props.kind];
  let title = m.ui_filter_no_match_title();
  if (props.kind === 'notUnderstood') {
    title = m.ui_filter_not_understood_title();
  }
  return (
    <div className="flex shrink-0 flex-col items-center gap-1 px-2 py-2 text-center">
      <Icon
        size={24}
        strokeWidth={1.5}
        className={cn(
          props.kind === 'notUnderstood' && 'text-status-warning',
          props.kind === 'noMatch' && 'text-text-tertiary',
        )}
      />
      <span className="text-sm font-medium text-text-primary">{title}</span>
      <span className="text-xs text-text-secondary">{props.description}</span>
    </div>
  );
};
