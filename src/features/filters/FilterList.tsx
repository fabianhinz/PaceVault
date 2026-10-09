import { Plus } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ActionTile } from '@/components/ui/ActionTile.tsx';
import { filterKey } from '@/lib/savedFilters.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { FilterRow } from './FilterRow.tsx';

interface FilterListProps {
  onApplied: () => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
}

export const FilterList = (props: FilterListProps) => {
  const savedFilters = useFiltersStore((s) => s.savedFilters);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  let activeKey: string | null = null;
  if (activeFilter) {
    activeKey = filterKey(activeFilter);
  }

  return (
    <div
      role="group"
      aria-label={m.ui_filter_list()}
      className="flex h-[342px] w-full flex-col gap-2 overflow-y-auto [scrollbar-width:none] lg:w-60"
    >
      {savedFilters.map((filter) => (
        <FilterRow
          key={filter.id}
          filter={filter}
          selected={filterKey(filter.criteria) === activeKey}
          onApply={() => {
            useFiltersStore.getState().toggleSavedFilter(filter.id);
            props.onApplied();
          }}
          onEdit={() => props.onEdit(filter.id)}
        />
      ))}
      <ActionTile
        layout="row"
        dashed
        icon={Plus}
        title={m.ui_filter_new_title()}
        description={m.ui_filter_new_desc()}
        buttonProps={{ 'aria-haspopup': 'dialog' }}
        onClick={props.onCreate}
      />
    </div>
  );
};
