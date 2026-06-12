import { useMemo, useRef } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { SessionItem } from '@/features/sessions/SessionItem.tsx';
import { MapPopupShell } from '@/features/map/MapPopupShell.tsx';
import { useExpandCard } from '@/lib/hooks/useExpandCard.ts';
import { useIsDesktop } from '@/lib/hooks/useIsDesktop.ts';
import { useLayoutStore } from '@/store/layout.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';
import { m } from '@/paraglide/messages.js';

export interface PopupInfo {
  x: number;
  y: number;
  sessions: TrainingSession[];
}

interface SessionsPickPopupProps {
  info: PopupInfo;
  onClose: () => void;
}

export const SessionsPickPopup = (props: SessionsPickPopupProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const expandCard = useExpandCard(cardRef);
  const isDesktop = useIsDesktop();

  const sorted = useMemo(
    () => props.info.sessions.toSorted((a, b) => b.date - a.date),
    [props.info.sessions],
  );

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
        title={m.ui_map_popup_sessions_title({ count: String(props.info.sessions.length) })}
        subtitle={m.ui_map_popup_sessions_subtitle()}
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
      <div className="overflow-y-auto min-h-0 space-y-2">
        {sorted.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            onNavigate={() => {
              props.onClose();
              if (useLayoutStore.getState().mobileMapActive) {
                useLayoutStore.getState().toggleMobileMap();
              }
            }}
          />
        ))}
      </div>
    </MapPopupShell>
  );
};
