import { useEffect, useMemo, useRef, useState } from 'react';
import { interpretFilterText } from '@/lib/filterGrammar.ts';
import type { FilterCriteria } from '@/lib/savedFilters.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useSessionsStore } from '@/store/sessions.ts';

export const useFilterBuilder = (open: boolean, onClose: () => void) => {
  const sessions = useSessionsStore((s) => s.sessions);
  const [text, setText] = useState('');
  const tilesRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const interpretations = useMemo(
    () => interpretFilterText(text, sessions, Date.now()),
    [text, sessions],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    return () => setText('');
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') {
        return;
      }
      if (text !== '') {
        setText('');
        return;
      }
      onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, text, onClose]);

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
