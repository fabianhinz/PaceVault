import { useRef } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { MapPopupShell } from '@/features/map/MapPopupShell.tsx';
import { StudioRouteItem } from '@/features/studio/StudioRouteItem.tsx';
import { useExpandCard } from '@/lib/hooks/useExpandCard.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import type { StudioRoutesPopupInfo } from '@/features/studio/hooks/useStudioRoutesPopup.ts';

/**
 * Studio-tab pick popup: the routes near the clicked point, each opening its
 * detail. Mirrors SessionsPickPopup — the detail page uses the special
 * add-marker popup instead.
 */
export const StudioRoutesPickPopup = (props: {
  info: StudioRoutesPopupInfo;
  onClose: () => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);
  const isDesktop = useIsDesktop();

  return (
    <MapPopupShell
      x={props.info.x}
      y={props.info.y}
      onClose={props.onClose}
      isExpanded={expandCard.isExpanded}
      desktopSizeClasses="w-[380px] max-h-[300px]"
      cardRef={cardRef}
    >
      <CardHeader
        title={m.ui_map_popup_routes_title({ count: String(props.info.routes.length) })}
        subtitle={m.ui_map_popup_routes_subtitle()}
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
      <div className="min-h-0 space-y-2 overflow-y-auto">
        {props.info.routes.map((route) => (
          <StudioRouteItem key={route.id} route={route} onNavigate={props.onClose} />
        ))}
      </div>
    </MapPopupShell>
  );
};
