import { CircleAlert, SearchX, SpellCheck, type LucideIcon } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import type { FilterSuggestion } from '@/lib/filterGrammar.ts';
import { cn } from '@/lib/utils.ts';

interface FilterFeedbackProps {
  suggestion: FilterSuggestion | undefined;
  unknown: string[];
  onSuggestion: (suggestion: FilterSuggestion) => void;
}

const DID_YOU_MEAN_SLOT = '\u0000';

export const FilterFeedback = (props: FilterFeedbackProps) => {
  const suggestion = props.suggestion;
  const didYouMean = m.ui_filter_did_you_mean({ word: DID_YOU_MEAN_SLOT }).split(DID_YOU_MEAN_SLOT);
  return (
    <div
      aria-live="polite"
      data-testid="filter-feedback"
      className="flex h-8 shrink-0 items-center gap-1.5 overflow-hidden border-b border-white/10 px-3"
    >
      {suggestion !== undefined && (
        <>
          <SpellCheck size={14} strokeWidth={1.5} className="shrink-0 text-accent-hover" />
          <span className="min-w-0 truncate text-xs text-text-secondary">
            {didYouMean[0]}
            <button
              type="button"
              className="cursor-pointer text-accent-hover underline underline-offset-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => props.onSuggestion(suggestion)}
            >
              {suggestion.replacement}
            </button>
            {didYouMean[1]}
          </span>
        </>
      )}
      {props.unknown.length > 0 && (
        <>
          <CircleAlert
            size={14}
            strokeWidth={1.5}
            className={cn('shrink-0 text-status-warning', suggestion !== undefined && 'ml-1')}
          />
          <span className="min-w-0 truncate text-xs text-status-warning">
            {m.ui_filter_not_understood({ words: props.unknown.join(', ') })}
          </span>
        </>
      )}
    </div>
  );
};

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
