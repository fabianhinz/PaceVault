import { useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { SessionItem } from '@/features/sessions/SessionItem.tsx';
import { useExpandCard } from '@/lib/hooks/useExpandCard.ts';
import { usePopupPosition } from '../map/hooks/usePopupPosition.ts';
import { useDismiss } from '../map/hooks/useDismiss.ts';
import { cn } from '@/lib/utils.ts';
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
  const popupRef = useDismiss(props.onClose, !expandCard.isExpanded);

  const style = usePopupPosition(props.info.x, props.info.y);

  const sorted = useMemo(
    () => props.info.sessions.toSorted((a, b) => b.date - a.date),
    [props.info.sessions],
  );

  return createPortal(
    <div ref={popupRef} style={style}>
      <Card
        ref={cardRef}
        variant="compact"
        className={cn(
          'flex flex-col overflow-hidden',
          expandCard.isExpanded ? '' : 'w-[380px] max-h-[300px]',
        )}
      >
        <CardHeader
          title={m.ui_map_popup_sessions_title({ count: String(props.info.sessions.length) })}
          subtitle={m.ui_map_popup_sessions_subtitle()}
          actions={
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={expandCard.isExpanded ? m.ui_btn_collapse() : m.ui_btn_expand()}
                onClick={expandCard.toggle}
              >
                {expandCard.isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </Button>
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
        <div className={cn('overflow-y-auto min-h-0 space-y-2')}>
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
      </Card>
    </div>,
    document.body,
  );
};
