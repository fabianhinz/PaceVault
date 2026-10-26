import type { FC } from 'react';
import { useCurrentPage } from '@/routing/useCurrentPage.ts';
import { Search, ZoomOut } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { PvActionTile } from '@pacevault/ui/components/pvActionTile/PvActionTile.tsx';
import { PvInput } from '@pacevault/ui/components/pvInput/PvInput.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { filterKey, filterName, filterTile, zoomTile } from '@/lib/filtering/filters.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { FilterEmptyState } from './FilterEmptyState.tsx';
import { filterIcon } from './filterIcon.ts';
import { useFilterBuilder } from './hooks/useFilterBuilder.ts';
import { useScrollFadeEffect } from '@pacevault/ui/hooks/useScrollFadeEffect.ts';

interface FiltersProps {
  open: boolean;
  sizing: 'fill' | 'content';
  onClose: () => void;
}

export const Filters: FC<FiltersProps> = (props) => {
  const savedFilters = useFiltersStore((s) => s.savedFilters);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  const device = useDevice();
  const currentPage = useCurrentPage();
  const builder = useFilterBuilder({ open: props.open, onClose: props.onClose });
  const text = builder.text;
  useScrollFadeEffect(builder.listRef);

  let activeKey: string | null = null;
  if (activeFilter) {
    activeKey = filterKey(activeFilter);
  }
  const zoom = zoomTile(activeFilter);
  const showZoomHint = zoom === null && device.pointerFine && currentPage === 'dashboard';

  return (
    <div
      className={cn(
        'flex w-full flex-col',
        props.sizing === 'fill' && 'h-full',
        props.sizing === 'content' && 'min-h-0',
      )}
    >
      <div
        className={cn(
          'shrink-0 border-b border-white/10 py-1',
          props.sizing === 'fill' && 'px-3',
          props.sizing === 'content' && 'px-5',
        )}
      >
        <PvInput
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
          'flex flex-col gap-1.5 overflow-y-auto [scrollbar-width:none]',
          props.sizing === 'fill' && 'min-h-0 flex-1 p-3',
          props.sizing === 'content' && 'scroll-fade min-h-0 shrink basis-252px px-5 py-3',
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
                <PvActionTile
                  key={filterKey(criteria)}
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
            {builder.showNotUnderstood && <FilterEmptyState />}
          </div>
        )}
        {text === '' && zoom !== null && activeFilter !== null && (
          <PvActionTile
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
          <PvActionTile
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
              <PvActionTile
                key={filter.id}
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
