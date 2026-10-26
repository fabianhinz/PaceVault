import type { FC } from 'react';
import { Funnel } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useFiltersStore } from '@/store/filters.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvIconBadge } from '@pacevault/ui/components/pvIconBadge/PvIconBadge.tsx';
import { DockCircle } from '@/components/layout/DockCircle.tsx';
import { activeItemClass, itemClass, itemClasses } from '@/components/layout/dockItemClasses.ts';
import type { DockItemKind } from '@/components/layout/types.ts';

interface DockFilterButtonProps {
  kind: DockItemKind;
  open: boolean;
  onClick: () => void;
}

export const DockFilterButton: FC<DockFilterButtonProps> = (props) => {
  const filterActive = useFiltersStore((s) => s.activeFilter !== null);
  const button = (
    <PvButton
      variant="ghost"
      size="icon"
      className={cn(itemClass, itemClasses[props.kind], props.open && activeItemClass)}
      onClick={props.onClick}
      aria-label={m.ui_dock_filter()}
      aria-expanded={props.open}
    >
      <PvIconBadge show={filterActive}>
        <Funnel size={20} strokeWidth={1.5} />
      </PvIconBadge>
    </PvButton>
  );
  if (props.kind === 'circle') {
    return <DockCircle>{button}</DockCircle>;
  }
  return button;
};
