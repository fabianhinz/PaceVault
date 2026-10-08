import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { MapPopupShell } from '@/features/map/MapPopupShell.tsx';
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
  return (
    <MapPopupShell
      x={props.x}
      y={props.y}
      onClose={props.onClose}
      desktopSizeClasses="w-[380px] max-h-[300px]"
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
    </MapPopupShell>
  );
};
