import { useMemo, useRef, useState } from 'react';
import { interpretFilterText } from '@/lib/filterGrammar.ts';
import type { FilterCriteria } from '@/lib/savedFilters.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useSessionsStore } from '@/store/sessions.ts';

export const useFilterBuilder = () => {
  const sessions = useSessionsStore((s) => s.sessions);
  const [text, setText] = useState('');
  const tilesRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const interpretations = useMemo(
    () => interpretFilterText(text, sessions, Date.now()),
    [text, sessions],
  );

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
    if (e.key === 'ArrowDown') {
      const tile = tilesRef.current?.querySelector('button');
      if (tile) {
        e.preventDefault();
        tile.focus();
      }
    }
  };

  return { text, setText, interpretations, select, handleKeyDown, tilesRef, listRef };
};

export type FilterBuilder = ReturnType<typeof useFilterBuilder>;
