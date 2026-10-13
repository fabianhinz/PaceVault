import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { ResponsivePopover } from '@/components/ui/ResponsivePopover.tsx';
import { useDevice } from '@/lib/hooks/useDevice.ts';
import { popupCollisionPadding } from '@/features/map/popupSafeZone.ts';
import { cn } from '@/lib/utils.ts';
import { m } from '@/paraglide/messages.js';

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
