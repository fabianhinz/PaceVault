import { useState, type FC } from 'react';
import { EllipsisVertical } from 'lucide-react';
import { useDevice } from '../../hooks/useDevice.ts';
import { PvButton } from '../pvButton/PvButton.tsx';
import { PvDropdownMenu } from '../pvDropdownMenu/PvDropdownMenu.tsx';
import { PvDropdownMenuTrigger } from '../pvDropdownMenu/PvDropdownMenuTrigger.tsx';
import { PvDropdownMenuContent } from '../pvDropdownMenu/PvDropdownMenuContent.tsx';
import { PvDropdownMenuItem } from '../pvDropdownMenu/PvDropdownMenuItem.tsx';
import { PvResponsivePopover } from '../pvResponsivePopover/PvResponsivePopover.tsx';
import { PvActionsMenuSheetRow } from './PvActionsMenuSheetRow.tsx';
import type { ActionsMenuItem } from './types.ts';

interface PvActionsMenuProps {
  label: string;
  closeLabel: string;
  items: ActionsMenuItem[];
}

export const PvActionsMenu: FC<PvActionsMenuProps> = (props) => {
  const device = useDevice();
  const [open, setOpen] = useState(false);
  const trigger = (
    <PvButton variant="ghost" size="icon" aria-label={props.label}>
      <EllipsisVertical size={18} />
    </PvButton>
  );

  if (device.desktop) {
    return (
      <PvDropdownMenu>
        <PvDropdownMenuTrigger asChild>{trigger}</PvDropdownMenuTrigger>
        <PvDropdownMenuContent align="end">
          {props.items.map((item) => {
            const Icon = item.icon;
            return (
              <PvDropdownMenuItem
                key={item.id}
                variant={item.danger ? 'danger' : 'default'}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                <Icon size={14} />
                {item.label}
              </PvDropdownMenuItem>
            );
          })}
        </PvDropdownMenuContent>
      </PvDropdownMenu>
    );
  }

  const select = (item: ActionsMenuItem) => {
    setOpen(false);
    item.onSelect();
  };
  const regular = props.items.filter((item) => !item.danger);
  const danger = props.items.filter((item) => item.danger);

  return (
    <PvResponsivePopover
      open={open}
      onOpenChange={setOpen}
      title={props.label}
      closeLabel={props.closeLabel}
      trigger={trigger}
    >
      <div role="menu" aria-label={props.label} className="flex flex-col">
        {regular.map((item) => (
          <PvActionsMenuSheetRow key={item.id} item={item} onSelect={() => select(item)} />
        ))}
        {danger.length > 0 && regular.length > 0 && (
          <div role="separator" className="my-1 h-px bg-white/10" />
        )}
        {danger.map((item) => (
          <PvActionsMenuSheetRow key={item.id} item={item} onSelect={() => select(item)} />
        ))}
      </div>
    </PvResponsivePopover>
  );
};
