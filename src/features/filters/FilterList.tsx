import { useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ZoomOut } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ActionTile } from '@/components/ui/ActionTile.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery.ts';
import { interpretFilterText } from '@/lib/filterGrammar.ts';
import {
  type FilterCriteria,
  filterKey,
  filterName,
  filterTile,
  zoomTile,
} from '@/lib/savedFilters.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { filterIcon } from './filterIcon.ts';

const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';

interface FilterListProps {
  open: boolean;
}

export const FilterList = (props: FilterListProps) => {
  const savedFilters = useFiltersStore((s) => s.savedFilters);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  const sessions = useSessionsStore((s) => s.sessions);
  const finePointer = useMediaQuery(FINE_POINTER_QUERY);
  const location = useLocation();
  const [text, setText] = useState('');
  const [wasOpen, setWasOpen] = useState(props.open);
  const tilesRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  if (props.open !== wasOpen) {
    setWasOpen(props.open);
    if (!props.open) {
      setText('');
    }
  }

  const interpretations = useMemo(
    () => interpretFilterText(text, sessions, Date.now()),
    [text, sessions],
  );

  let activeKey: string | null = null;
  if (activeFilter) {
    activeKey = filterKey(activeFilter);
  }
  const zoom = zoomTile(activeFilter);
  const showZoomHint = zoom === null && finePointer && location.pathname === '/';

  const select = (criteria: FilterCriteria) => {
    useFiltersStore.getState().saveBuilderFilter(criteria);
    setText('');
    requestAnimationFrame(() => {
      listRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest' });
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const first = interpretations[0];
    if (e.key === 'Enter' && first) {
      e.preventDefault();
      select(first);
      return;
    }
    if (e.key === 'Escape' && text !== '') {
      e.stopPropagation();
      setText('');
      return;
    }
    if (e.key === 'ArrowDown') {
      const tile = tilesRef.current?.querySelector('button');
      if (tile) {
        e.preventDefault();
        tile.focus();
      }
    }
  };

  return (
    <div className="flex h-[358px] w-full flex-col lg:w-64">
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
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div
        ref={listRef}
        role="group"
        aria-label={m.ui_filter_list()}
        className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3 [scrollbar-width:none]"
      >
        {text !== '' && (
          <div
            ref={tilesRef}
            role="group"
            aria-live="polite"
            data-testid="filter-builder-tiles"
            className="flex shrink-0 flex-col gap-1.5"
          >
            {interpretations.map((criteria) => {
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
                  onClick={() => select(criteria)}
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
