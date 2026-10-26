import { useMemo, useRef, useState, type RefObject } from 'react';
import { useKeyPressEvent } from 'react-use';
import { interpretFilterText } from '@/lib/filterGrammar.ts';
import type { FilterCriteria } from '@/lib/savedFilters.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useNotUnderstoodHint } from './useNotUnderstoodHint.ts';

interface FilterBuilder {
  text: string;
  setText: (text: string) => void;
  interpretations: FilterCriteria[];
  showNotUnderstood: boolean;
  select: (criteria: FilterCriteria) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  tilesRef: RefObject<HTMLDivElement | null>;
  listRef: RefObject<HTMLDivElement | null>;
}

export const useFilterBuilder = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}): FilterBuilder => {
  const [text, setText] = useState('');
  const tilesRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const interpretations = useMemo(() => interpretFilterText({ text, now: Date.now() }), [text]);
  const showNotUnderstood = useNotUnderstoodHint({ text, interpretations });

  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (!open) setText('');
  }

  useKeyPressEvent('Escape', () => {
    if (!open) return;
    if (text !== '') {
      setText('');
      return;
    }
    onClose();
  });

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

  return {
    text,
    setText,
    interpretations,
    showNotUnderstood,
    select,
    handleKeyDown,
    tilesRef,
    listRef,
  };
};
