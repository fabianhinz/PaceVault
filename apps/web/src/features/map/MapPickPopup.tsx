import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@pacevault/ui/components/Button.tsx';
import { CardHeader } from '@pacevault/ui/components/CardHeader.tsx';
import { ResponsivePopover } from '@pacevault/ui/components/ResponsivePopover.tsx';
import { useDevice } from '@pacevault/ui/hooks/useDevice.ts';
import { popupCollisionPadding } from '@/features/map/popupSafeZone.ts';
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

export const MapPickPopup = (props: MapPickPopupProps) => {
  const device = useDevice();
  return (
    <ResponsivePopover
      open
      onOpenChange={(open) => {
        if (!open) props.onClose();
      }}
      anchor={{ x: props.x, y: props.y }}
      side="right"
      align="start"
      collisionPadding={popupCollisionPadding(device.isDesktop)}
      title={props.title}
      subtitle={props.subtitle}
      className="flex flex-col overflow-hidden p-2 lg:max-h-[300px] lg:w-[380px] lg:max-w-none"
    >
      {device.isDesktop && (
        <CardHeader
          title={props.title}
          subtitle={props.subtitle}
          actions={
            <Button
              variant="ghost"
              size="icon"
              aria-label={m.ui_btn_close()}
              onClick={props.onClose}
            >
              <X size={16} />
            </Button>
          }
        />
      )}
      <div className={cn('space-y-2', device.isDesktop && 'min-h-0 overflow-y-auto')}>
        {props.children}
      </div>
    </ResponsivePopover>
  );
};
