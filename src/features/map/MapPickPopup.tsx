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
      className={cn(
        'flex flex-col overflow-hidden p-2',
        'max-lg:h-[50dvh] max-lg:landscape:h-[75dvh] max-lg:pb-[max(0.5rem,env(safe-area-inset-bottom))]',
        'max-lg:pl-[max(0.5rem,env(safe-area-inset-left))] max-lg:pr-[max(0.5rem,env(safe-area-inset-right))]',
        'lg:max-h-[300px] lg:w-[380px] lg:max-w-none',
      )}
    >
      <CardHeader
        title={props.title}
        subtitle={props.subtitle}
        actions={
          <Button variant="ghost" size="icon" aria-label={m.ui_btn_close()} onClick={props.onClose}>
            <X size={16} />
          </Button>
        }
      />
      <div className="min-h-0 space-y-2 overflow-y-auto">{props.children}</div>
    </ResponsivePopover>
  );
};
