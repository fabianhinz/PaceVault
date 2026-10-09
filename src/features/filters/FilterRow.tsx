import { useCallback, useState } from 'react';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ActionTile } from '@/components/ui/ActionTile.tsx';
import { Button } from '@/components/ui/Button.tsx';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/DropdownMenu.tsx';
import { cn } from '@/lib/utils.ts';
import { useLongPress } from '@/lib/hooks/useLongPress.ts';
import { type SavedFilter, filterName, filterTile } from '@/lib/savedFilters.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { filterIcon } from './filterIcon.ts';

interface FilterRowProps {
  filter: SavedFilter;
  selected: boolean;
  onApply: () => void;
  onEdit: () => void;
}

export const FilterRow = (props: FilterRowProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const longPress = useLongPress(openMenu);
  const tile = filterTile(props.filter.criteria);
  const name = filterName(props.filter.criteria);

  return (
    <ActionTile
      layout="row"
      icon={filterIcon(props.filter.criteria)}
      title={tile.title}
      description={tile.description}
      selected={props.selected}
      buttonProps={{
        ...longPress.handlers,
        'aria-label': name,
        'aria-pressed': props.selected,
        title: name,
      }}
      onClick={() => {
        if (longPress.consumeLongPress()) {
          return;
        }
        props.onApply();
      }}
      menu={
        <DropdownMenuRoot open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={m.ui_filter_actions({ name })}
              className={cn(
                'lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 data-[state=open]:opacity-100',
                props.selected && 'text-zinc-500 hover:bg-black/5 hover:text-zinc-900',
                !props.selected && 'text-text-tertiary',
              )}
            >
              <EllipsisVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onEscapeKeyDown={(e) => e.stopPropagation()}>
            <DropdownMenuItem onSelect={props.onEdit}>
              <Pencil size={14} />
              {m.ui_filter_edit()}
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="danger"
              onSelect={() => useFiltersStore.getState().deleteSavedFilter(props.filter.id)}
            >
              <Trash2 size={14} />
              {m.ui_btn_delete()}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuRoot>
      }
    />
  );
};
