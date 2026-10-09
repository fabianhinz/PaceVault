import { useLocation } from 'react-router-dom';
import { Search, ZoomOut } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ActionTile } from '@/components/ui/ActionTile.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery.ts';
import { cn } from '@/lib/utils.ts';
import { filterKey, filterName, filterTile, zoomTile } from '@/lib/savedFilters.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { filterIcon } from './filterIcon.ts';
import { useFilterBuilder } from './hooks/useFilterBuilder.ts';

const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

interface FilterListProps {
  open: boolean;
  sizing: 'fill' | 'content';
  onClose: () => void;
}

export const FilterList = (props: FilterListProps) => {
  const savedFilters = useFiltersStore((s) => s.savedFilters);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  const finePointer = useMediaQuery(FINE_POINTER_QUERY);
  const location = useLocation();
  const builder = useFilterBuilder(props.open, props.onClose);
  const text = builder.text;

  let activeKey: string | null = null;
  if (activeFilter) {
    activeKey = filterKey(activeFilter);
  }
  const zoom = zoomTile(activeFilter);
  const showZoomHint = zoom === null && finePointer && location.pathname === '/';

  return (
    <div className={cn('flex w-full flex-col', props.sizing === 'fill' && 'h-full')}>
      <div className="shrink-0 border-b border-white/10 px-3 py-1">
        <Input
          variant="bare"
          icon={Search}
          type="text"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="done"
          aria-label={m.ui_filter_builder_label()}
          placeholder={m.ui_filter_builder_placeholder()}
          value={text}
          onChange={(e) => builder.setText(e.target.value)}
          onKeyDown={builder.handleKeyDown}
        />
      </div>
      <div
        ref={builder.listRef}
        role="group"
        aria-label={m.ui_filter_list()}
        className={cn(
          'flex flex-col gap-1.5 overflow-y-auto p-3 [scrollbar-width:none]',
          props.sizing === 'fill' && 'min-h-0 flex-1',
          props.sizing === 'content' && 'max-h-[252px]',
        )}
      >
        {text !== '' && (
          <div
            ref={builder.tilesRef}
            role="group"
            aria-live="polite"
            data-testid="filter-builder-tiles"
            className="flex shrink-0 flex-col gap-1.5"
          >
            {builder.interpretations.map((criteria) => {
              const tile = filterTile(criteria);
              const name = filterName(criteria);
              return (
                <ActionTile
                  key={filterKey(criteria)}
                  layout="row"
                  look="dashed"
                  icon={filterIcon(criteria)}
                  title={tile.title}
                  description={tile.description}
                  selected={filterKey(criteria) === activeKey}
                  buttonProps={{ 'aria-label': m.ui_filter_apply({ name }), title: name }}
                  onClick={() => builder.select(criteria)}
                />
              );
            })}
          </div>
        )}
        {text === '' && zoom !== null && activeFilter !== null && (
          <ActionTile
            layout="row"
            look="accent"
            icon={ZoomOut}
            title={zoom.title}
            description={zoom.description}
            buttonProps={{
              'aria-label': m.ui_filter_zoom_clear({ name: filterName(activeFilter) }),
              'aria-pressed': true,
              title: filterName(activeFilter),
            }}
            onClick={() => useFiltersStore.getState().clearActiveFilter()}
          />
        )}
        {text === '' && showZoomHint && (
          <ActionTile
            layout="row"
            look="hint"
            icon={ZoomOut}
            title={m.ui_filter_zoom_hint_title()}
            description={m.ui_filter_zoom_hint_desc()}
          />
        )}
        {text === '' &&
          savedFilters.map((filter) => {
            const tile = filterTile(filter.criteria);
            const name = filterName(filter.criteria);
            const selected = filterKey(filter.criteria) === activeKey;
            return (
              <ActionTile
                key={filter.id}
                layout="row"
                icon={filterIcon(filter.criteria)}
                title={tile.title}
                description={tile.description}
                selected={selected}
                buttonProps={{ 'aria-label': name, 'aria-pressed': selected, title: name }}
                onClick={() => useFiltersStore.getState().toggleSavedFilter(filter.id)}
              />
            );
          })}
      </div>
    </div>
  );
};
