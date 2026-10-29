import type { FC, Ref } from 'react';
import { cn } from '../../lib/cn.ts';
import type { ActionsMenuItem } from './types.ts';

interface PvActionsMenuSheetRowProps {
  item: ActionsMenuItem;
  onSelect: () => void;
  ref?: Ref<HTMLButtonElement>;
}

export const PvActionsMenuSheetRow: FC<PvActionsMenuSheetRowProps> = (props) => {
  const Icon = props.item.icon;
  return (
    <button
      ref={props.ref}
      type="button"
      role="menuitem"
      disabled={props.item.disabled}
      onClick={props.onSelect}
      className={cn(
        'flex h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors hover:bg-white/10',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
        props.item.danger ? 'text-status-danger' : 'text-text-primary',
      )}
    >
      <Icon size={18} className="shrink-0" />
      {props.item.label}
    </button>
  );
};
