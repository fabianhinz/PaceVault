import type { FC, ReactNode } from 'react';
import { X } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvResponsivePopover } from '@pacevault/ui/components/pvResponsivePopover/PvResponsivePopover.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { popupCollisionPadding } from '@/components/mapBackground/popupSafeZone.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { m } from '@pacevault/i18n/messages.js';

interface MapPickPopupProps {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}

export const MapPickPopup: FC<MapPickPopupProps> = (props) => {
  const device = useDevice();
  return (
    <PvResponsivePopover
      closeLabel={m.ui_sheet_drag_close()}
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      anchor={{ x: props.x, y: props.y }}
      side="right"
      align="start"
      collisionPadding={popupCollisionPadding(device.desktop)}
      title={props.title}
      subtitle={props.subtitle}
      className="flex flex-col overflow-hidden p-2 lg:max-h-300px lg:w-380px lg:max-w-none"
    >
      {device.desktop && (
        <PvCardHeader
          title={props.title}
          subtitle={props.subtitle}
          actions={
            <PvButton
              variant="ghost"
              size="icon"
              aria-label={m.ui_btn_close()}
              onClick={props.onClose}
            >
              <X size={16} />
            </PvButton>
          }
        />
      )}
      <div className={cn('space-y-2', device.desktop && 'min-h-0 overflow-y-auto')}>
        {props.children}
      </div>
    </PvResponsivePopover>
  );
};
