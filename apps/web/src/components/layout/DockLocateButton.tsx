import type { FC } from 'react';
import { Locate, LocateFixed, LocateOff } from 'lucide-react';
import { m } from '@pacevault/i18n/messages.js';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { useGeolocationStore } from '@/store/geolocation.ts';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvIconBadge } from '@pacevault/ui/components/pvIconBadge/PvIconBadge.tsx';
import { DockCircle } from '@/components/layout/DockCircle.tsx';
import { itemClass, CLASSES_BY_DOCK_ITEM_SHAPE } from '@/components/layout/dockItemClasses.ts';
import type { DockItemKind } from '@/components/layout/types.ts';

interface DockLocateButtonProps {
  kind: DockItemKind;
}

export const DockLocateButton: FC<DockLocateButtonProps> = (props) => {
  const tracking = useGeolocationStore((s) => s.tracking);
  const error = useGeolocationStore((s) => s.error);
  let LocateIcon = Locate;
  if (error) {
    LocateIcon = LocateOff;
  } else if (tracking) {
    LocateIcon = LocateFixed;
  }
  const button = (
    <PvButton
      variant="ghost"
      size="icon"
      className={cn(itemClass, CLASSES_BY_DOCK_ITEM_SHAPE[props.kind])}
      onClick={() => useGeolocationStore.getState().toggleTracking()}
      aria-label={m.ui_dock_locate_me()}
    >
      <PvIconBadge show={tracking}>
        <LocateIcon size={20} strokeWidth={1.5} />
      </PvIconBadge>
    </PvButton>
  );
  if (props.kind === 'circle') {
    return <DockCircle>{button}</DockCircle>;
  }
  return button;
};
