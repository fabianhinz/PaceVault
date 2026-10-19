import { CircleAlert } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';

export const FilterEmptyState = () => (
  <div className="flex shrink-0 flex-col items-center gap-1 px-2 py-2 text-center">
    <CircleAlert size={24} strokeWidth={1.5} className="text-status-warning" />
    <span className="text-sm font-medium text-text-primary">
      {m.ui_filter_not_understood_title()}
    </span>
    <span className="text-xs text-text-secondary">{m.ui_filter_not_understood_desc()}</span>
  </div>
);
