import { useState } from 'react';
import { EllipsisVertical, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn.ts';
import { useDevice } from '../hooks/useDevice.ts';
import { Button } from './Button.tsx';
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './DropdownMenu.tsx';
import { ResponsivePopover } from './ResponsivePopover.tsx';

interface ActionsMenuItem {
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}

interface ActionsMenuProps {
  label: string;
  items: ActionsMenuItem[];
}

const SheetRow = (props: { item: ActionsMenuItem; onSelect: () => void }) => {
  const Icon = props.item.icon;
  return (
    <button
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

export const ActionsMenu = (props: ActionsMenuProps) => {
  const device = useDevice();
  const [open, setOpen] = useState(false);
  const trigger = (
    <Button variant="ghost" size="icon" aria-label={props.label}>
      <EllipsisVertical size={18} />
    </Button>
  );

  if (device.isDesktop) {
    return (
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {props.items.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.label}
                variant={item.danger ? 'danger' : 'default'}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                <Icon size={14} />
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenuRoot>
    );
  }

  const select = (item: ActionsMenuItem) => {
    setOpen(false);
    item.onSelect();
  };
  const regular = props.items.filter((item) => !item.danger);
  const danger = props.items.filter((item) => item.danger);

  return (
    <ResponsivePopover open={open} onOpenChange={setOpen} title={props.label} trigger={trigger}>
      <div role="menu" aria-label={props.label} className="flex flex-col">
        {regular.map((item) => (
          <SheetRow key={item.label} item={item} onSelect={() => select(item)} />
        ))}
        {danger.length > 0 && regular.length > 0 && (
          <div role="separator" className="my-1 h-px bg-white/10" />
        )}
        {danger.map((item) => (
          <SheetRow key={item.label} item={item} onSelect={() => select(item)} />
        ))}
      </div>
    </ResponsivePopover>
  );
};
