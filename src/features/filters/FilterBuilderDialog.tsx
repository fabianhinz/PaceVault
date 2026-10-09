import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ActionTile } from '@/components/ui/ActionTile.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { DialogRoot, DialogContent, DialogTitle } from '@/components/ui/Dialog.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { interpretFilterText } from '@/lib/filterGrammar.ts';
import {
  type FilterCriteria,
  type SavedFilter,
  filterKey,
  filterName,
  filterTile,
} from '@/lib/savedFilters.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { useSessionsStore } from '@/store/sessions.ts';
import { filterIcon } from './filterIcon.ts';

const INPUT_ID = 'filter-builder-input';

interface FilterBuilderDialogProps {
  open: boolean;
  editingId: string | null;
  onOpenChange: (open: boolean) => void;
}

interface FilterBuilderFormProps {
  editing: SavedFilter | undefined;
  onClose: () => void;
}

const FilterBuilderForm = (props: FilterBuilderFormProps) => {
  const [text, setText] = useState(() => {
    if (props.editing) {
      return filterName(props.editing.criteria);
    }
    return '';
  });
  const sessions = useSessionsStore((s) => s.sessions);
  const activeFilter = useFiltersStore((s) => s.activeFilter);
  const inputRef = useRef<HTMLInputElement>(null);
  const tilesRef = useRef<HTMLDivElement>(null);

  const interpretations = useMemo(
    () => interpretFilterText(text, sessions, Date.now()),
    [text, sessions],
  );

  useEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  let activeKey: string | null = null;
  if (activeFilter) {
    activeKey = filterKey(activeFilter);
  }

  const select = (criteria: FilterCriteria) => {
    let editingId: string | null = null;
    if (props.editing) {
      editingId = props.editing.id;
    }
    useFiltersStore.getState().saveBuilderFilter(criteria, editingId);
    props.onClose();
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

  return (
    <>
      <div className="-mr-3 flex h-11 items-center justify-end lg:hidden">
        <Button variant="ghost" size="icon" aria-label={m.ui_btn_close()} onClick={props.onClose}>
          <X size={16} />
        </Button>
      </div>
      <Label htmlFor={INPUT_ID}>
        {props.editing ? m.ui_filter_builder_label_edit() : m.ui_filter_builder_label()}
      </Label>
      <Input
        ref={inputRef}
        id={INPUT_ID}
        type="text"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="done"
        placeholder={m.ui_filter_builder_placeholder()}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div
        ref={tilesRef}
        role="group"
        aria-live="polite"
        data-testid="filter-builder-tiles"
        className="mt-3 flex h-[210px] flex-col gap-3"
      >
        {interpretations.map((criteria) => {
          const tile = filterTile(criteria);
          const name = filterName(criteria);
          return (
            <ActionTile
              key={filterKey(criteria)}
              layout="row"
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
    </>
  );
};

export const FilterBuilderDialog = (props: FilterBuilderDialogProps) => {
  const editing = useFiltersStore((s) => s.savedFilters.find((f) => f.id === props.editingId));

  return (
    <DialogRoot open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-lg:pt-0">
        <DialogTitle className="sr-only">{m.ui_dock_filter()}</DialogTitle>
        <FilterBuilderForm
          key={props.editingId ?? 'new'}
          editing={editing}
          onClose={() => props.onOpenChange(false)}
        />
      </DialogContent>
    </DialogRoot>
  );
};
