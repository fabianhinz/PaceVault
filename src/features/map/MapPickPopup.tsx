import { useRef, type ReactNode } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { MapPopupShell } from '@/features/map/MapPopupShell.tsx';
import { useExpandCard } from '@/lib/hooks/useExpandCard.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { m } from '@/paraglide/messages.js';

interface MapPickPopupProps {
  x: number;
  y: number;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Expandable map pick popup: a titled card listing pickable items near a click,
 * with desktop expand/collapse and a close control. Shared by the sessions and
 * studio-routes pick popups.
 */
export const MapPickPopup = (props: MapPickPopupProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);
  const isDesktop = useIsDesktop();

  return (
    <MapPopupShell
      x={props.x}
      y={props.y}
      onClose={props.onClose}
      isExpanded={expandCard.isExpanded}
      desktopSizeClasses="w-[380px] max-h-[300px]"
      cardRef={cardRef}
    >
      <CardHeader
        title={props.title}
        subtitle={props.subtitle}
        actions={
          <>
            {isDesktop && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={expandCard.isExpanded ? m.ui_btn_collapse() : m.ui_btn_expand()}
                onClick={expandCard.toggle}
              >
                {expandCard.isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label={m.ui_btn_close()}
              onClick={props.onClose}
            >
              <X size={16} />
            </Button>
          </>
        }
      />
      <div className="min-h-0 space-y-2 overflow-y-auto">{props.children}</div>
    </MapPopupShell>
  );
};
